$cssFile = "app\globals.css"
$cssContent = [System.IO.File]::ReadAllText($cssFile)

# Add nav-icon variables to :root
$searchRoot = "--nav-bg: rgba(5, 5, 20, 0.7);"
$replaceRoot = "--nav-icon-color: #a78bfa;`n  --nav-icon-hover-bg: rgba(139,92,246,0.2);`n  --nav-bg: rgba(5, 5, 20, 0.7);"
$cssContent = $cssContent.Replace($searchRoot, $replaceRoot)

# Add nav-icon variables to light theme
$searchLight = "--nav-bg: rgba(255, 255, 255, 0.8);"
$replaceLight = "--nav-icon-color: #475569;`n  --nav-icon-hover-bg: rgba(15, 23, 42, 0.05);`n  --nav-bg: rgba(255, 255, 255, 0.8);"
$cssContent = $cssContent.Replace($searchLight, $replaceLight)

# Add nav-icon variables to dark theme
$searchDark = "--nav-bg: rgba(18, 18, 20, 0.7);"
$replaceDark = "--nav-icon-color: #a1a1aa;`n  --nav-icon-hover-bg: rgba(255, 255, 255, 0.08);`n  --nav-bg: rgba(18, 18, 20, 0.7);"
$cssContent = $cssContent.Replace($searchDark, $replaceDark)

[System.IO.File]::WriteAllText($cssFile, $cssContent)

$navFile = "components\station-navbar.tsx"
$navContent = [System.IO.File]::ReadAllText($navFile)

# Replace shortcut icon colors and hover
$navContent = $navContent -replace 'color: "var\(--color-comet\)"', 'color: "var(--nav-icon-color)"'
$navContent = $navContent -replace 'hover:bg-\[var\(--color-border\)\]', 'hover:bg-[var(--nav-icon-hover-bg)]'

# Replace dropdown theme picker background
$searchThemeBg = 'background: "var(--color-border)"'
$replaceThemeBg = 'background: "var(--color-nebula)"'
$navContent = $navContent.Replace($searchThemeBg, $replaceThemeBg)

[System.IO.File]::WriteAllText($navFile, $navContent)
