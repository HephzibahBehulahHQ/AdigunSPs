param(
    [Parameter(Mandatory)]
    [string] $SchemaPath
)

$ErrorActionPreference = 'Stop'
$schema = Get-Item -LiteralPath $SchemaPath
if ($schema.PSIsContainer) { throw 'Supply the path to the PLCopen TC6 2.01 XSD file.' }
$namespace = 'http://www.plcopen.org/xml/tc6_0201'

Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $xml = @'
import { createPlcopenXml } from "./src/plcopen.js";

const contacts = [[{ tag:"Start", mode:"NO" }]];
const output = (name) => ({ name, type:"BOOL", role:"output" });
const project = {
  name:"PLCopen TON schema fixture",
  editorType:"LD",
  tags:[{ name:"Start", type:"BOOL", role:"input" }, output("Delayed"), output("Immediate"),
    { name:"adiguntimer_1", type:"BOOL" }],
  rungs:[
    { branches:contacts, coil:"Delayed", timer:{ type:"TON", tag:"T0.0", preset:100, output:"DN" } },
    { branches:contacts, coil:"Immediate", timer:{ type:"TON", tag:"T0.1", preset:200, output:"EN" } }
  ]
};
process.stdout.write(createPlcopenXml(project));
'@ | node --input-type=module
    if ($LASTEXITCODE -ne 0) { throw 'Could not generate the PLCopen XML test fixture.' }
} finally {
    Pop-Location
}
$xml = $xml -join [Environment]::NewLine

$settings = [System.Xml.XmlReaderSettings]::new()
$settings.ValidationType = [System.Xml.ValidationType]::Schema
$settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
$settings.XmlResolver = $null
[void] $settings.Schemas.Add($namespace, $schema.FullName)

function Assert-PlcopenXmlValid([string] $Content) {
    $textReader = [System.IO.StringReader]::new($Content)
    try {
        $reader = [System.Xml.XmlReader]::Create($textReader, $settings)
        try {
            [void] $reader.MoveToContent()
            if ($reader.NamespaceURI -ne $namespace) { throw 'Unexpected PLCopen XML namespace.' }
            while ($reader.Read()) {}
        } finally {
            $reader.Dispose()
        }
    } finally {
        $textReader.Dispose()
    }
}

Assert-PlcopenXmlValid $xml
Write-Output 'PASS: TC6 2.01 validates delayed and immediate TON coils with default timer addresses.'

$invalidXml = [regex]::Replace($xml, '<contentHeader name="[^"]+"', '<contentHeader')
if ($invalidXml -eq $xml) { throw 'Could not construct the invalid fixture.' }
try {
    Assert-PlcopenXmlValid $invalidXml
    throw 'The invalid fixture unexpectedly passed schema validation.'
} catch [System.Management.Automation.MethodInvocationException] {
    if ($_.Exception.InnerException -isnot [System.Xml.Schema.XmlSchemaValidationException]) { throw }
    Write-Output 'PASS: TC6 2.01 rejects a project header without its required name.'
}
