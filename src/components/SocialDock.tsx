"use client";

import { FloatingDock } from "@/components/ui/floating-dock";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { IconBrandLinkedin, IconMail } from "@tabler/icons-react";

const socialLinks = [
  {
    title: "GitHub",
    icon: <SiGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    href: "https://github.com/urmzd",
  },
  {
    title: "LinkedIn",
    icon: <IconBrandLinkedin className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    href: "https://linkedin.com/in/urmzd",
  },
  {
    title: "Email",
    icon: <IconMail className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    href: "mailto:hello@urmzd.com",
  },
];

export default function SocialDock() {
  return (
    <FloatingDock
      items={socialLinks}
      desktopClassName="fixed bottom-16 left-1/2 -translate-x-1/2 z-40"
      mobileClassName="fixed bottom-4 right-4 z-40"
    />
  );
}
