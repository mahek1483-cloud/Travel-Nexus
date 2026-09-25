# Package Travel Nexus for distribution
$items = @(
    'index.html', 'css', 'js', 'images', 'api', 'scripts',
    'package.json', 'package-lock.json', 'vercel.json', 'manifest.json',
    'sw.js', 'start.bat', 'README.md', '.gitignore',
    'firestore.rules', 'storage.rules', 'package_zip.ps1'
) | Where-Object { Test-Path $_ }

$desktop = "C:\Users\DELL\OneDrive\Desktop"
Compress-Archive -Path $items -DestinationPath 'Travel-Nexus.zip' -Force
Write-Host "Travel-Nexus.zip created successfully! Size: $((Get-Item 'Travel-Nexus.zip').Length) bytes"

Copy-Item 'Travel-Nexus.zip' -Destination "$desktop\Travel-Nexus.zip" -Force -ErrorAction SilentlyContinue
Copy-Item 'Travel-Nexus.zip' -Destination "$desktop\project.zip" -Force -ErrorAction SilentlyContinue
Copy-Item 'Travel-Nexus.zip' -Destination "C:\Users\DELL\.gemini\antigravity\brain\98b8696b-56db-4a8c-9fda-bcb67e43b660\Travel-Nexus.zip" -Force -ErrorAction SilentlyContinue
