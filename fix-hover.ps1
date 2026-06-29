$file = "components\station-navbar.tsx"
$content = [System.IO.File]::ReadAllText($file)

# 1. Update Hover Backgrounds for the 4 shortcut icons
$searchHover = ' className="navbar-icon-btn group relative" style={{ padding: "8px", borderRadius: "8px", color: "var(--color-comet)", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(139,92,246,0.2)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}'
$replaceHover = ' className="navbar-icon-btn group relative hover:bg-[var(--color-border)]" style={{ padding: "8px", borderRadius: "8px", color: "var(--color-comet)", transition: "all 0.2s" }}'
$content = $content.Replace($searchHover, $replaceHover)

# 2. Update Callsign color
$searchCallsign = 'color: "var(--color-violet-light)"'
$replaceCallsign = 'color: "var(--color-comet)"'
$content = $content.Replace($searchCallsign, $replaceCallsign)

[System.IO.File]::WriteAllText($file, $content)
