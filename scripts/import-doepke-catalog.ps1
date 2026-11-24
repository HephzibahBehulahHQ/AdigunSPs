param([Parameter(Mandatory)][string] $Archive)

$ErrorActionPreference = 'Stop'
$path = (Resolve-Path -LiteralPath $Archive).Path
if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne 'FAD9E719D9AC28B27FE5B56568EAF71C2DFCC6F6B3EAC0DCE285BBC9827E6B92') {
    throw 'Archive does not match the verified Doepke release.'
}

# Approved ETIM classes for electrical panels and connected field equipment.
$classes = @{
    EC000003 = @('Protection', 'Residual-current circuit breaker')
    EC000042 = @('Protection', 'Miniature circuit breaker')
    EC000905 = @('Protection', 'Residual-current breaker with overcurrent protection')
    EC002693 = @('Protection', 'Residual-current circuit breaker with auxiliary function')
    EC000215 = @('Accessories', 'Panel busbar')
    EC001286 = @('Accessories', 'Shunt trip')
    EC000216 = @('Control devices', 'Switch-disconnector')
    EC001653 = @('Contactors', 'Installation contactor')
    EC002695 = @('Protection', 'Residual-current and overcurrent breaker with auxiliary device')
    EC000277 = @('Protection', 'Fuse switch-disconnector')
    EC000188 = @('Relays', 'Impulse relay')
    EC001642 = @('Protection', 'Fuse plug')
    EC011178 = @('Control devices', 'Float switch')
    EC001652 = @('Relays', 'Installation relay')
    EC004552 = @('Protection', 'Residual-current monitoring device')
    EC002048 = @('Protection', 'Residual-current transformer')
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($path)
$groups = @{}
$seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
try {
    $entry = $zip.GetEntry('Doepke-BMEcat2005-50-ETIM-100_PL2027-01-01_ml_2026-10-28.xml')
    if (!$entry) { throw 'Missing Doepke catalog XML.' }
    $settings = [Xml.XmlReaderSettings]::new()
    $settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
    $settings.MaxCharactersInDocument = 90000000
    $stream = $entry.Open()
    try {
        $reader = [Xml.XmlReader]::Create($stream, $settings)
        try {
            while ($reader.Read()) {
                if ($reader.NodeType -ne 'Element' -or $reader.LocalName -ne 'PRODUCT') { continue }
                $subtree = $reader.ReadSubtree()
                try {
                    $document = [xml]::new()
                    $document.Load($subtree)
                } finally { $subtree.Dispose() }
                $product = $document.DocumentElement
                $class = [string] $product.PRODUCT_FEATURES.REFERENCE_FEATURE_GROUP_ID
                if (!$classes.ContainsKey($class)) { continue }
                $details = $product.PRODUCT_DETAILS
                $identifier = ([string] $details.MANUFACTURER_PID).Trim()
                if ($details.PRODUCT_TYPE -ne 'physical' -or $details.MANUFACTURER_NAME -ne 'Doepke Schaltgeräte GmbH' -or
                    !$identifier -or $identifier -ne $product.SUPPLIER_PID -or !$seen.Add($identifier)) {
                    throw "Invalid or duplicate manufacturer order code: $identifier"
                }
                if (!$groups.ContainsKey($class)) { $groups[$class] = [System.Collections.Generic.List[string]]::new() }
                $groups[$class].Add($identifier)
            }
        } finally { $reader.Dispose() }
    } finally { $stream.Dispose() }
} finally { $zip.Dispose() }

$rows = foreach ($class in ($groups.Keys | Sort-Object)) {
    $category, $family = $classes[$class]
    $ids = @($groups[$class] | Sort-Object)
    ConvertTo-Json -Compress -Depth 3 -InputObject @($category, $family, $class, $ids)
}
$output = Join-Path $PSScriptRoot '../src/doepke-catalog-data.js'
$lines = @('// Generated from the Doepke BMEcat export by scripts/import-doepke-catalog.ps1.', 'export const doepkeCatalogGroups = [') +
    @($rows | ForEach-Object { "  $_," }) + '];'
[IO.File]::WriteAllText($output, ($lines -join "`n") + "`n")
Write-Output "Imported $($seen.Count) distinct Doepke hardware order codes."
