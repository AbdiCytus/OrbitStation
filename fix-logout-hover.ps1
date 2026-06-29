$cssFile = "app\globals.css"
$cssContent = [System.IO.File]::ReadAllText($cssFile)

# Add nav-danger-hover variables to :root
$searchRoot = "--nav-danger-color: var(--color-pink-glow);"
$replaceRoot = "--nav-danger-hover-bg: rgba(244, 114, 182, 0.15);`n  --nav-danger-hover-color: var(--color-pink-glow);`n  --nav-danger-color: var(--color-pink-glow);"
$cssContent = $cssContent.Replace($searchRoot, $replaceRoot)

# Add nav-danger-hover variables to light theme
$searchLight = "--nav-danger-color: var(--color-pink-mid);"
$replaceLight = "--nav-danger-hover-bg: rgba(219, 39, 119, 0.1);`n  --nav-danger-hover-color: var(--color-pink-mid);`n  --nav-danger-color: var(--color-pink-mid);"
$cssContent = $cssContent.Replace($searchLight, $replaceLight)

# Add nav-danger-hover variables to dark theme
$searchDark = "--nav-danger-color: var(--color-pink-glow);"
$replaceDark = "--nav-danger-hover-bg: rgba(244, 114, 182, 0.15);`n  --nav-danger-hover-color: var(--color-pink-glow);`n  --nav-danger-color: var(--color-pink-glow);"
$cssContent = $cssContent.Replace($searchDark, $replaceDark)

# Update .navbar-menu-item-danger:hover
$searchClass = ".navbar-menu-item-danger:hover {`n  background: var(--color-pink-mid);`n  color: var(--color-starlight);`n}"
$replaceClass = ".navbar-menu-item-danger:hover {`n  background: var(--nav-danger-hover-bg);`n  color: var(--nav-danger-hover-color) !important;`n}"
$cssContent = $cssContent.Replace($searchClass, $replaceClass)

[System.IO.File]::WriteAllText($cssFile, $cssContent)
