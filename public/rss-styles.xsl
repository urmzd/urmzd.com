<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS Feed</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 640px;
            margin: 0 auto;
            padding: 2rem 1rem;
            line-height: 1.6;
            color: #1a1a1a;
            background: #fafafa;
          }
          .banner {
            background: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1rem 1.25rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: #555;
          }
          .banner strong { color: #1a1a1a; }
          .banner code {
            background: #e0e0e0;
            padding: 0.15em 0.4em;
            border-radius: 4px;
            font-size: 0.85em;
            word-break: break-all;
          }
          h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
          .description { color: #666; margin-bottom: 2rem; }
          .post { border-top: 1px solid #e0e0e0; padding: 1rem 0; }
          .post-title { font-size: 1.1rem; }
          .post-title a { color: #1a1a1a; text-decoration: none; }
          .post-title a:hover { text-decoration: underline; }
          .post-meta { font-size: 0.8rem; color: #888; margin-top: 0.25rem; }
          .post-desc { font-size: 0.9rem; color: #555; margin-top: 0.5rem; }
          .tag {
            display: inline-block;
            background: #e8e8e8;
            color: #555;
            font-size: 0.75rem;
            padding: 0.1em 0.5em;
            border-radius: 4px;
            margin-right: 0.25rem;
          }
        </style>
      </head>
      <body>
        <div class="banner">
          <strong>This is an RSS feed.</strong> To subscribe, copy this URL into your reader:
          <span style="display: inline-flex; align-items: center; gap: 0.4rem;">
            <code id="feed-url"><xsl:value-of select="/rss/channel/link"/>rss.xml</code>
            <button onclick="navigator.clipboard.writeText(document.getElementById('feed-url').textContent).then(function(){{var b=document.getElementById('copy-btn');b.textContent='Copied!';setTimeout(function(){{b.textContent='Copy';}},2000);}})" id="copy-btn" style="font-family: inherit; font-size: 0.8rem; padding: 0.2em 0.6em; border: 1px solid #ccc; border-radius: 4px; background: #fff; color: #333; cursor: pointer;">Copy</button>
          </span>
          <div style="margin-top: 0.75rem;">
            <strong>Quick subscribe:</strong>
            <a style="margin-left: 0.25rem;" href="https://feedly.com/i/subscription/feed/https://urmzd.com/rss.xml">Feedly</a>
            &#xA0;&#xB7;&#xA0;
            <a href="https://newsblur.com/?url=https://urmzd.com/rss.xml">NewsBlur</a>
            &#xA0;&#xB7;&#xA0;
            <a href="https://www.inoreader.com/?add_feed=https://urmzd.com/rss.xml">Inoreader</a>
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.85rem;">
            On iPhone, use an app like <strong>NetNewsWire</strong> or <strong>Reeder</strong> and add the URL above.
          </div>
        </div>
        <h1><xsl:value-of select="/rss/channel/title"/></h1>
        <p class="description"><xsl:value-of select="/rss/channel/description"/></p>
        <xsl:for-each select="/rss/channel/item">
          <div class="post">
            <div class="post-title">
              <a>
                <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                <xsl:value-of select="title"/>
              </a>
            </div>
            <div class="post-meta">
              <xsl:value-of select="pubDate"/>
            </div>
            <xsl:if test="description">
              <div class="post-desc"><xsl:value-of select="description"/></div>
            </xsl:if>
            <xsl:if test="category">
              <div style="margin-top: 0.5rem;">
                <xsl:for-each select="category">
                  <span class="tag"><xsl:value-of select="."/></span>
                </xsl:for-each>
              </div>
            </xsl:if>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
