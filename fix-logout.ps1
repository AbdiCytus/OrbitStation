$cssFile = "app\globals.css"
$cssContent = [System.IO.File]::ReadAllText($cssFile)

# Add nav-danger-color variables to :root
$searchRoot = "--nav-icon-color: #a78bfa;"
$replaceRoot = "--nav-danger-color: var(--color-pink-glow);`n  --nav-icon-color: #a78bfa;"
$cssContent = $cssContent.Replace($searchRoot, $replaceRoot)

# Add nav-danger-color variables to light theme
$searchLight = "--nav-icon-color: #475569;"
$replaceLight = "--nav-danger-color: var(--color-pink-mid);`n  --nav-icon-color: #475569;"
$cssContent = $cssContent.Replace($searchLight, $replaceLight)

# Add nav-danger-color variables to dark theme
$searchDark = "--nav-icon-color: #a1a1aa;"
$replaceDark = "--nav-danger-color: var(--color-pink-glow);`n  --nav-icon-color: #a1a1aa;"
$cssContent = $cssContent.Replace($searchDark, $replaceDark)

# Add .navbar-menu-item-danger
$searchClass = ".navbar-menu-item-danger:hover {"
$replaceClass = ".navbar-menu-item-danger {`n  color: var(--nav-danger-color) !important;`n}`n`n.navbar-menu-item-danger:hover {"
$cssContent = $cssContent.Replace($searchClass, $replaceClass)

[System.IO.File]::WriteAllText($cssFile, $cssContent)
