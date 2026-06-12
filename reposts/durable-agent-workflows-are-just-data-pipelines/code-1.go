package workflow

type Role string

const (
	RoleUser      Role = "user"      // a human
	RoleAssistant Role = "assistant" // the model
	RoleSystem    Role = "system"    // the orchestrator itself
)

type Kind string

const (
	KindMessage    Kind = "message"     // plain user or assistant text
	KindToolCall   Kind = "tool_call"   // an assistant message: a request
	KindToolResult Kind = "tool_result" // from system (API call) or user (HITL)
	KindFailure    Kind = "failure"     // a failed attempt is an output too
	KindFinal      Kind = "final"
)

// Unit is the atom: input in, output out. Role is the axis; Kind is
// the part that lives under it, mirroring the message model every
// provider already speaks:
//
//	RoleUser      -> KindMessage, KindToolResult (human-in-the-loop)
//	RoleAssistant -> KindMessage, KindToolCall, KindFinal
//	RoleSystem    -> KindToolResult (API call), KindFailure
type Unit struct {
	Seq    int
	Role   Role
	Kind   Kind
	Input  string
	Output string
}

// Store is the entire durability contract: Append must not return until
// the unit is durable. If a unit is in the log, it happened. If it
// isn't, it didn't. There is no third state.
type Store interface {
	Load(wid string) ([]Unit, error)
	Append(wid string, u Unit) error
}

// Run executes -- or resumes, which is the same thing -- workflow wid.
// step produces the next unit from history: a model turn, a tool
// execution, a subagent. The engine doesn't care which.
func Run(
	wid, query string,
	store Store,
	step func(history []Unit) (Unit, bool),
) (<-chan Unit, <-chan error) {
	units := make(chan Unit)
	errc := make(chan error, 1)

	go func() {
		defer close(units)
		defer close(errc)

		history, err := store.Load(wid)
		if err != nil {
			errc <- err
			return
		}

		// Write-ahead: durable first, visible second. Intent units
		// (tool calls) land in the log before their effects ever run.
		commit := func(u Unit) error {
			u.Seq = len(history)
			if err := store.Append(wid, u); err != nil {
				return err
			}
			history = append(history, u)
			units <- u
			return nil
		}

		// Fresh workflow: the query itself is the first unit.
		if len(history) == 0 {
			if err := commit(Unit{Role: RoleUser, Kind: KindMessage, Input: query}); err != nil {
				errc <- err
				return
			}
		}

		// Resuming a finished workflow re-executes nothing.
		if last := history[len(history)-1]; last.Kind == KindFinal {
			units <- last
			return
		}

		for {
			next, done := step(history)
			if err := commit(next); err != nil {
				errc <- err
				return
			}
			if done {
				return
			}
		}
	}()

	return units, errc
}
