param([Parameter(Mandatory)][string] $Archive)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archivePath = (Resolve-Path -LiteralPath $Archive).Path
$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
if ($archiveHash -ne '318C71B5272915631C24E593ABC6EDF53DD1BACD2D781DBA4E50E829603EBC32') {
    throw 'Archive does not match the verified Finder release.'
}
$zip = [IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    $entry = $zip.GetEntry('FINBMECAT_ENG_20260824_3996421788343213.xml')
    if (!$entry) { throw 'Expected the September 2026 English Finder BMEcat export.' }
    $settings = [System.Xml.XmlReaderSettings]::new()
    $settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
    $settings.MaxCharactersInDocument = 40000000
    $stream = $entry.Open()
    try {
        $reader = [System.Xml.XmlReader]::Create($stream, $settings)
        try {
            $document = [xml]::new()
            $document.Load($reader)
        } finally { $reader.Dispose() }
    } finally { $stream.Dispose() }
} finally { $zip.Dispose() }

$catalog = $document.BMECAT
$exportDate = $catalog.HEADER.CATALOG.DATETIME.DATE
if ($exportDate -ne '2026-09-02' -or $catalog.HEADER.SUPPLIER.SUPPLIER_NAME -ne 'Finder Spa') {
    throw 'Unexpected catalog date or supplier.'
}

$groups = [ordered]@{}
$seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($product in $catalog.T_NEW_CATALOG.PRODUCT) {
    $details = $product.PRODUCT_DETAILS
    $family = ([string] $details.DESCRIPTION_SHORT).Trim()
    $category = switch -Regex ($family) {
        '\b(THERMAL OVERLOAD RELAY|SURGE PROTECTION DEVICE)\b' { 'Protection'; break }
        '\bCONTACTOR\b' { 'Contactors'; break }
        '\b(OPTA (DIGITAL )?EXPANSION|DIGITAL EXPANSION PLR OPTA)\b' { 'Digital I/O modules'; break }
        '\b(POWER RELAY|PCB RELAY|P\.C\.B\. RELAY|GENERAL PURPOSE RELAY|INDUSTRIAL RELAY|INTERFACE RELAY|INTEFACE RELAY|MODULA[R]? INTERFACE WITH RELAY|SOLID STATE RELAY|ULTRASLIM RELAY|SUBMINIATURE RELAY|SAFETY RELAY|RELAY WITH FORCIBLY GUIDED CONTACTS|MONITORING RELAY|LEVEL CONTROL RELAY)\b' { 'Relays'; break }
        '\b(TERMINAL SOCKET|PCB SOCKET|PUSH-IN SOCKET|FILTER FAN|TOUCH - SAFE HEATER)\b' { 'Accessories'; break }
        '\b(SWITCHING POWER SUPPLY|POWER SUPPLY 5A)\b' { 'Power supplies'; break }
    }
    if (!$category) { continue }
    $identifier = ([string] $details.MANUFACTURER_PID).Trim()
    if (!$identifier -or $identifier -ne $product.SUPPLIER_PID -or !$seen.Add($identifier)) {
        throw "Missing, inconsistent, or duplicate manufacturer order code: $identifier"
    }
    $key = "$category|${family}"
    if (!$groups.Contains($key)) {
        $groups[$key] = [System.Collections.Generic.List[string]]::new()
    }
    $groups[$key].Add($identifier)
}

$rows = foreach ($key in ($groups.Keys | Sort-Object)) {
    $category, $family = $key.Split('|', 2)
    $identifiers = @($groups[$key] | Sort-Object)
    ConvertTo-Json -Compress -Depth 3 -InputObject @($category, $family, $identifiers)
}
$output = Join-Path $PSScriptRoot '../src/finder-catalog-data.js'
$lines = @('// Generated from the Finder BMEcat export by scripts/import-finder-catalog.ps1.', 'export const finderCatalogGroups = [') +
    @($rows | ForEach-Object { "  $_," }) + '];'
[IO.File]::WriteAllText($output, ($lines -join "`n") + "`n")
Write-Output "Imported $($seen.Count) distinct Finder hardware order codes."
