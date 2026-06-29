$file = "app\globals.css"
$content = [System.IO.File]::ReadAllText($file)

# 1. :root
$searchRoot = "--glass-bg: rgba(17, 24, 39, 0.6);"
$replaceRoot = "--nav-bg: rgba(5, 5, 20, 0.7);`n  --nav-glass-bg: rgba(10, 10, 30, 0.75);`n  --glass-bg: rgba(17, 24, 39, 0.6);"
$content = $content.Replace($searchRoot, $replaceRoot)

# 2. [data-theme="light"]
$searchLight = "--glass-bg: rgba(255, 255, 255, 0.7);"
$replaceLight = "--nav-bg: rgba(255, 255, 255, 0.8);`n  --nav-glass-bg: rgba(248, 250, 252, 0.85);`n  --glass-bg: rgba(255, 255, 255, 0.7);"
$content = $content.Replace($searchLight, $replaceLight)

# 3. [data-theme="dark"]
$searchDark = "--glass-bg: rgba(18, 18, 20, 0.6);"
$replaceDark = "--nav-bg: rgba(18, 18, 20, 0.7);`n  --nav-glass-bg: rgba(24, 24, 27, 0.75);`n  --glass-bg: rgba(18, 18, 20, 0.6);"
$content = $content.Replace($searchDark, $replaceDark)

# 4. .station-navbar
$searchNav = "background: var(--glass-bg);"
$replaceNav = "background: var(--nav-bg);"
$content = $content.Replace($searchNav, $replaceNav)

# 5. .glass-nav
$searchGlassNav = "background: var(--glass-bg-hover);"
$replaceGlassNav = "background: var(--nav-glass-bg);"
$content = $content.Replace($searchGlassNav, $replaceGlassNav)

[System.IO.File]::WriteAllText($file, $content)
