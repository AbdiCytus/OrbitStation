$file = "components\station-navbar.tsx"
$content = [System.IO.File]::ReadAllText($file)

# Fix shortcut icons color
$content = $content -replace 'color: "#a78bfa"', 'color: "var(--color-comet)"'

# Fix notification badge border
$content = $content -replace 'border: "2px solid #141423"', 'border: "2px solid var(--color-cosmos)"'

[System.IO.File]::WriteAllText($file, $content)
