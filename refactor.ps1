$files = Get-ChildItem -Path "components", "app/station" -Recurse -Include *.tsx, *.ts

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)

    # Backgrounds
    $content = $content -replace 'bg-\[#0a0f1e\]', 'bg-cosmos'
    $content = $content -replace 'bg-\[#030712\]', 'bg-void'
    $content = $content -replace 'bg-\[#111827\]', 'bg-nebula'
    $content = $content -replace 'bg-\[#141423\]', 'bg-nebula'
    $content = $content -replace 'bg-\[#1c2a4a\]', 'bg-aurora'
    
    # Blacks & transparent blacks
    $content = $content -replace 'bg-black/50', 'bg-cosmos/50'
    $content = $content -replace 'bg-black/40', 'bg-cosmos/40'
    $content = $content -replace 'bg-black/80', 'bg-cosmos/80'
    $content = $content -replace 'bg-black/20', 'bg-cosmos/20'

    # Glass and borders
    $content = $content -replace 'border-white/10', 'border-border'
    $content = $content -replace 'border-white/5', 'border-border'
    $content = $content -replace 'border-gray-800', 'border-border'
    $content = $content -replace 'border-\[rgba\(255,255,255,0\.1\)\]', 'border-border'

    # Whites (Backgrounds)
    $content = $content -replace 'bg-white/5', 'bg-starlight/5'
    $content = $content -replace 'bg-white/10', 'bg-starlight/10'
    $content = $content -replace 'bg-white/20', 'bg-starlight/20'
    $content = $content -replace 'hover:bg-white/5', 'hover:bg-starlight/5'
    $content = $content -replace 'hover:bg-white/10', 'hover:bg-starlight/10'
    $content = $content -replace 'hover:bg-white/20', 'hover:bg-starlight/20'

    # Text Colors
    $content = $content -replace 'text-gray-400', 'text-comet'
    $content = $content -replace 'text-gray-300', 'text-comet'
    $content = $content -replace 'text-gray-500', 'text-dust'
    $content = $content -replace 'hover:text-white', 'hover:text-starlight'

    # Process line by line for text-white to preserve it on colored buttons
    $lines = $content -split "`r`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match 'bg-violet' -or $lines[$i] -match 'bg-red' -or $lines[$i] -match 'bg-blue') {
            # Leave text-white alone if it's on a button with colored background
        } else {
            $lines[$i] = $lines[$i] -replace '(?<!hover:)text-white', 'text-starlight'
        }
    }
    $content = $lines -join "`r`n"

    [System.IO.File]::WriteAllText($file.FullName, $content)
}
