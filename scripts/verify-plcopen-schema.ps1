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
    $fixturesJson = @'
import { createPlcopenXml } from "./src/plcopen.js";

const contacts = [[{ tag:"Start", mode:"NO" }]];
const output = (name) => ({ name, type:"BOOL", role:"output" });
const project = {
  task:{ name:"MainCycle", mode:"cyclic", cycleMs:750 },
  name:"PLCopen TON schema fixture",
  editorType:"LD",
  tags:[{ name:"Start", type:"BOOL", role:"input" }, output("Delayed"), output("Immediate"),
    { name:"adiguntimer_1", type:"BOOL" }],
  rungs:[
    { branches:contacts, coil:"Delayed", timer:{ type:"TON", tag:"T0.0", preset:100, output:"DN" } },
    { branches:contacts, coil:"Immediate", timer:{ type:"TON", tag:"T0.1", preset:200, output:"EN" } }
  ]
};
const offDelay = {
  ...project, name:"PLCopen TOF schema fixture",
  rungs:project.rungs.map((rung) => ({ ...rung, timer:{ ...rung.timer, type:"TOF" } }))
};
const pulse = {
  ...project, name:"PLCopen TP schema fixture",
  rungs:project.rungs.map((rung) => ({ ...rung, timer:{ ...rung.timer, type:"TP" } }))
};
const structuredText = {
  name:"PLCopen Structured Text schema fixture", editorType:"ST",
  tags:[{ name:"Temperature", type:"REAL", role:"input" }, { name:"Control", type:"REAL", role:"output" }],
  stSource:"(* Heat & control *)\nIF Temperature < 20.0 THEN Control := Temperature * 2.0; ELSE Control := 0.0; END_IF;"
};
const functionBlocks = {
  name:"PLCopen FBD schema fixture", editorType:"FBD",
  tags:[{ name:"Start", type:"BOOL", role:"input" }, { name:"Stop", type:"BOOL", role:"input" },
    { name:"Permit", type:"BOOL" }, { name:"Above", type:"BOOL" }, output("Lamp"),
    { name:"Temperature", type:"REAL", role:"input" }, { name:"Limit", type:"REAL", role:"input" }],
  fbdBlocks:[
    { type:"NOT", inputs:["Stop"], outputTag:"Permit" },
    { type:"GT", inputs:["Temperature", "Limit"], outputTag:"Above" },
    { type:"AND", inputs:["Start", "Permit", "Above"], outputTag:"Lamp" }
  ]
};
process.stdout.write(JSON.stringify({ ladder:createPlcopenXml(project), tof:createPlcopenXml(offDelay), tp:createPlcopenXml(pulse), st:createPlcopenXml(structuredText), fbd:createPlcopenXml(functionBlocks) }));
'@ | node --input-type=module
    if ($LASTEXITCODE -ne 0) { throw 'Could not generate the PLCopen XML test fixture.' }
} finally {
    Pop-Location
}
$fixtures = ($fixturesJson -join [Environment]::NewLine) | ConvertFrom-Json

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

Assert-PlcopenXmlValid $fixtures.ladder
Write-Output 'PASS: TC6 2.01 validates delayed and immediate TON coils with default timer addresses.'
Assert-PlcopenXmlValid $fixtures.tof
Write-Output 'PASS: TC6 2.01 validates TOF instances and coil wiring.'
Assert-PlcopenXmlValid $fixtures.tp
Write-Output 'PASS: TC6 2.01 validates TP instances and coil wiring.'
Assert-PlcopenXmlValid $fixtures.st
Write-Output 'PASS: TC6 2.01 validates a Structured Text body with declared scalar tags.'
Assert-PlcopenXmlValid $fixtures.fbd
Write-Output 'PASS: TC6 2.01 validates connected Boolean FBD gates and a numeric comparison.'

$invalidXml = [regex]::Replace($fixtures.ladder, '<contentHeader name="[^"]+"', '<contentHeader')
if ($invalidXml -eq $fixtures.ladder) { throw 'Could not construct the invalid fixture.' }
try {
    Assert-PlcopenXmlValid $invalidXml
    throw 'The invalid fixture unexpectedly passed schema validation.'
} catch [System.Management.Automation.MethodInvocationException] {
    if ($_.Exception.InnerException -isnot [System.Xml.Schema.XmlSchemaValidationException]) { throw }
    Write-Output 'PASS: TC6 2.01 rejects a project header without its required name.'
}
