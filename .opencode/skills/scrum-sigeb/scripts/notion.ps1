param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet("backlog", "historia", "crear", "mover", "sprint", "evento", "equipo", "reglas")]
  [string]$Comando,

  [Parameter(Position = 1)]
  [string]$Filtro,

  [Parameter(Position = 2)]
  [string]$Estado,
  [string]$Titulo,
  [string]$Tipo,
  [string]$Prioridad,
  [string]$Puntos,
  [string]$Descripcion,
  [string]$Criterios,
  [string]$Responsable,
  [string]$EventoTipo,
  [string]$Observacion
)

$ErrorActionPreference = "Stop"
$ApiVersion = "2022-06-28"

$Token = $env:NOTION_TOKEN
if (-not $Token) {
  $TokenFile = Join-Path $HOME ".config\opencode\notion.token"
  if (Test-Path $TokenFile) { $Token = (Get-Content $TokenFile -Raw).Trim() }
}
if (-not $Token) { throw "No se encontro NOTION_TOKEN. Configurar env NOTION_TOKEN o $envHOME\.config\opencode\notion.token" }

$Headers = @{
  Authorization    = "Bearer $Token"
  "Notion-Version" = $ApiVersion
  "Content-Type"   = "application/json"
}

# --- IDs de bases de datos / paginas (workspace David Space / Scrum SIGEB - recreacion) ---
$DbProductBacklog  = "08bea44e-4b7e-836f-9521-01d09c33d308"
$DbSprintTracker   = "12eea44e-4b7e-82aa-ba54-01f0c193c97a"
$DbSprintPlanning  = "0b4ea44e-4b7e-8268-8528-01089d254746"
$DbDailyScrum      = "d31ea44e-4b7e-83b4-9db3-018dff69e5ce"
$DbSprintReview    = "e6bea44e-4b7e-8219-b795-01bad1355d6f"
$DbSprintRetro     = "179ea44e-4b7e-8311-9e7a-01f41583671b"
$DbTasks           = "758ea44e-4b7e-826f-a1b9-81fcae96913a"
$DbTeamMembers     = "ab1ea44e-4b7e-82ce-95c1-01da9745deaf"
$DbTeamContacts    = "8c7ea44e-4b7e-83c2-a602-81090b160e71"
$DbTeamResponsibi  = "ef1ea44e-4b7e-8310-b76b-817824f13009"
$PageGuide         = "ca2ea44e-4b7e-8263-87c5-012cfda0d15d"
$PageDefinitionOfReady = "2dcea44e-4b7e-8338-ad53-01af3a407c9b"

# Estado del Product Backlog -> transiciones permitidas (workflow Scrum)
$Transiciones = @{
  "New Issues"  = @("Ice Box", "Backlog", "In Progress")
  "Ice Box"     = @("New Issues", "Backlog")
  "Backlog"     = @("New Issues", "Ice Box", "In Progress")
  "In Progress" = @("Backlog", "In Review")
  "In Review"   = @("Backlog", "In Progress", "Done")
  "Done"        = @("Backlog", "In Review")
}

function Get-RichText([object]$Prop) {
  if (-not $Prop) { return "" }
  ($Prop.rich_text | ForEach-Object { $_.plain_text }) -join ""
}
function Get-Title([object]$Prop) {
  if (-not $Prop) { return "" }
  ($Prop.title | ForEach-Object { $_.plain_text }) -join ""
}

function Read-Json([string]$Body) {
  return Invoke-RestMethod -Method Post -Uri "https://api.notion.com/v1/databases/$DbProductBacklog/query" -Headers $Headers -Body $Body
}

function Get-SprintActivo {
  $r = Invoke-RestMethod -Method Post -Uri "https://api.notion.com/v1/databases/$DbSprintTracker/query" -Headers $Headers -Body '{"page_size":100}'
  foreach ($row in $r.results) {
    $st = $row.properties.Status.status.name
    $nom = Get-Title $row.properties.'Sprint Name'
    if ($st -eq "Current" -and $nom) { return @{ Id = $row.id; Nombre = $nom; Props = $row.properties } }
  }
  return $null
}

function Find-Historia([string]$Termino) {
  $body = '{"page_size":100}'
  $r = Read-Json $body
  foreach ($row in $r.results) {
    $tit = Get-Title $row.properties.Title
    if ($tit -like "*$Termino*") { return $row }
  }
  return $null
}

switch ($Comando) {
  "backlog" {
    $body = '{"page_size":100}'
    $r = Read-Json $body
    $rows = $r.results
    if ($Filtro) {
      $rows = $rows | Where-Object {
        $t = Get-Title $_.properties.Title
        $st = $_.properties.Status.status.name
        $tp = $_.properties.Type.select.name
        $pr = $_.properties.Priority.select.name
        ($t -like "*$Filtro*") -or ($st -like "*$Filtro*") -or ($tp -like "*$Filtro*") -or ($pr -like "*$Filtro*")
      }
    }
    "Backlog total: $($r.results.Count) (mostrando $($rows.Count))"
    $rows | ForEach-Object {
      $p = $_.properties
      $st  = if ($p.Status.status) { $p.Status.status.name } else { "" }
      $tp  = if ($p.Type.select) { $p.Type.select.name } else { "" }
      $pt  = if ($p.Points.number) { $p.Points.number } else { "" }
      $pr  = if ($p.Priority.select) { $p.Priority.select.name } else { "" }
      $sprintRel = if ($p.Sprint.relation) { ($p.Sprint.relation | ForEach-Object { $_.id }) -join "," } else { "" }
      "{0,-42} | {1,-12} | {2,-9} | pts={3,-3} | {4,-16} | sprint={5}" -f (Get-Title $p.Title), $st, $tp, $pt, $pr, $sprintRel
    }
  }

  "historia" {
    if (-not $Filtro) { throw "Uso: notion.ps1 historia <US-xxx | termino>" }
    $row = Find-Historia $Filtro
    if (-not $row) { throw "No se encontro ninguna historia con '$Filtro'" }
    $p = $row.properties
    "ID        : $($row.id)"
    "Title     : $(Get-Title $p.Title)"
    "Status    : $(if ($p.Status.status) { $p.Status.status.name })"
    "Type      : $(if ($p.Type.select) { $p.Type.select.name })"
    "Points    : $(if ($p.Points.number) { $p.Points.number })"
    "Priority  : $(if ($p.Priority.select) { $p.Priority.select.name })"
    "Created   : $(if ($p.'Created time'.created_time) { $p.'Created time'.created_time })"
    "Assigned  : $(($p.'Assigned To'.people | ForEach-Object { $_.name }) -join ', ')"
    $sprintRel = $p.Sprint.relation
    if ($sprintRel) {
      $noms = foreach ($rel in $sprintRel) {
        try { $sp = Invoke-RestMethod -Method Get -Uri "https://api.notion.com/v1/pages/$($rel.id)" -Headers $Headers; Get-Title $sp.properties.'Sprint Name' } catch { $rel.id }
      }
      "Sprint    : $($noms -join ', ')"
    }
    "Desc      : $(Get-RichText $p.Description)"
    "AC        : $(Get-RichText $p.'Acceptance Criteria')"
  }

  "crear" {
    if (-not $Titulo) { throw "Uso: notion.ps1 crear -Titulo '...' [-Tipo Feature|-Prioridad Medium|-Puntos 5|-Descripcion '...'|-Criterios '...'|-Estado New Issues]" }
    $tipoOk = @("Bug", "Epic", "Knowledge Task", "Technical Work", "Feature", "User Stories")
    $prioOk = @("Critical Priority", "High Priority", "Medium Priority", "Low Priority", "Nice to have")
    if ($Tipo -and $Tipo -notin $tipoOk) { throw "Tipo invalido. Validos: $($tipoOk -join ', ')" }
    if ($Prioridad -and $Prioridad -notin $prioOk) { throw "Prioridad invalida. Validas: $($prioOk -join ', ')" }
    $estadoOk = $Transiciones.Keys
    if ($Estado -and $Estado -notin $estadoOk) { throw "Estado invalido. Validos: $($estadoOk -join ', ')" }

    $props = @{
      "Title"  = @{ "title" = @(@{ "text" = @{ "content" = $Titulo } }) }
      "Status" = @{ "status" = @{ "name" = $(if ($Estado) { $Estado } else { "New Issues" }) } }
    }
    if ($Tipo) { $props["Type"] = @{ "select" = @{ "name" = $Tipo } } }
    if ($Prioridad) { $props["Priority"] = @{ "select" = @{ "name" = $Prioridad } } }
    if ($Puntos) { $props["Points"] = @{ "number" = [int]$Puntos } }
    if ($Descripcion) { $props["Description"] = @{ "rich_text" = @(@{ "text" = @{ "content" = $Descripcion } }) } }
    if ($Criterios) { $props["Acceptance Criteria"] = @{ "rich_text" = @(@{ "text" = @{ "content" = $Criterios } }) } }
    if ($Responsable) {
      $knownUsers = @{
        "david" = "135d872b-594c-8141-aed6-0002f31473ca"
        "chiroy" = "135d872b-594c-8141-aed6-0002f31473ca"
      }
      $uid = $knownUsers[$Responsable.ToLower()]
      if ($uid) { $props["Assigned To"] = @{ "people" = @(@{ "object" = "user"; "id" = $uid }) } }
      else { Write-Host "AVISO: no se encontro usuario Notion para '$Responsable'; no se asigno." }
    }

    $body = @{
      parent     = @{ "database_id" = $DbProductBacklog }
      properties = $props
    } | ConvertTo-Json -Depth 10
    $new = Invoke-RestMethod -Method Post -Uri "https://api.notion.com/v1/pages" -Headers $Headers -Body $body
    "Creada: $(Get-Title $new.properties.Title) | id=$($new.id)"
  }

  "mover" {
    if (-not $Filtro -or -not $Estado) { throw "Uso: notion.ps1 mover <US-xxx | termino> <estado>" }
    $row = Find-Historia $Filtro
    if (-not $row) { throw "No se encontro ninguna historia con '$Filtro'" }
    $actual = if ($row.properties.Status.status) { $row.properties.Status.status.name } else { "New Issues" }
    if (-not $Transiciones[$actual].Contains($Estado)) {
      throw "Transicion invalida: $actual -> $Estado. Permitidas: $($Transiciones[$actual] -join ', ')"
    }
    $body = @{
      properties = @{ "Status" = @{ "status" = @{ "name" = $Estado } } }
    } | ConvertTo-Json -Depth 6
    $upd = Invoke-RestMethod -Method Patch -Uri "https://api.notion.com/v1/pages/$($row.id)" -Headers $Headers -Body $body
    "$(Get-Title $upd.properties.Title): $actual -> $Estado"
  }

  "sprint" {
    $s = Get-SprintActivo
    if (-not $s) { throw "No se encontro un sprint activo (status=Current con nombre)" }
    $p = $s.Props
    "SPRINT ACTIVO: $($s.Nombre)  (id=$($s.Id))"
    "Status   : $($p.Status.status.name)"
    "Goal     : $(Get-RichText $p.'Sprint Goal')"
    "Duration : $(Get-RichText $p.Duration)"
    "Progress : $(Get-RichText $p.Progress)"
    "Summary  : $(Get-RichText $p.Summary)"
    $q = @{
      filter     = @{ property = "Sprint"; relation = @{ contains = $s.Id } }
      page_size  = 100
    } | ConvertTo-Json -Depth 6
    $r = Invoke-RestMethod -Method Post -Uri "https://api.notion.com/v1/databases/$DbProductBacklog/query" -Headers $Headers -Body $q
    "Backlog del sprint: $($r.results.Count) items"
    $ptsTot = 0; $ptsDone = 0
    $r.results | ForEach-Object {
      $p2 = $_.properties
      $st = if ($p2.Status.status) { $p2.Status.status.name } else { "" }
      $pt = if ($p2.Points.number) { [double]$p2.Points.number } else { 0 }
      $ptsTot += $pt
      if ($st -eq "Done") { $ptsDone += $pt }
      "  {0,-42} | {1,-12} | pts={2}" -f (Get-Title $p2.Title), $st, $pt
    }
    if ($ptsTot -gt 0) { "Puntos: $ptsDone / $ptsTot completados ($([math]::Round(100 * $ptsDone / $ptsTot))%)" }
  }

  "evento" {
    if (-not $EventoTipo) { throw "Uso: notion.ps1 evento -EventoTipo daily|planning|review|retro -Observacion 'texto' [-Titulo 'titulo']" }
    $s = Get-SprintActivo
    if (-not $s) { throw "No se encontro un sprint activo" }
    $dbId = switch ($EventoTipo.ToLower()) {
      "daily"    { $DbDailyScrum }
      "planning" { $DbSprintPlanning }
      "review"   { $DbSprintReview }
      "retro"    { $DbSprintRetro }
      default    { throw "Tipo de evento invalido. Validos: daily|planning|review|retro" }
    }
    $fecha = (Get-Date).ToString("yyyy-MM-dd")
    $label = switch ($EventoTipo.ToLower()) {
      "daily"    { "Daily Scrum" }
      "planning" { "Sprint Planning" }
      "review"   { "Sprint Review" }
      "retro"    { "Sprint Retrospective" }
    }
    $titulo = if ($Titulo) { $Titulo } else { "$label - $($s.Nombre) - $fecha" }
    $props = @{
      "Meeting Title" = @{ "title" = @(@{ "text" = @{ "content" = $titulo } }) }
      "Date"          = @{ "date" = @{ "start" = $fecha } }
      "Status"        = @{ "status" = @{ "name" = "Not Started" } }
      "Sprint"        = @{ "relation" = @(@{ "id" = $s.Id }) }
    }
    $campoObs = switch ($EventoTipo.ToLower()) {
      "daily"    { "Today's Plan" }
      "planning" { "Remarks" }
      "review"   { "Agenda" }
      "retro"    { "Sprint Summary" }
    }
    if ($Observacion) { $props[$campoObs] = @{ "rich_text" = @(@{ "text" = @{ "content" = $Observacion } }) } }
    $body = @{
      parent     = @{ "database_id" = $dbId }
      properties = $props
    } | ConvertTo-Json -Depth 8
    $new = Invoke-RestMethod -Method Post -Uri "https://api.notion.com/v1/pages" -Headers $Headers -Body $body
    "$label registrado: $titulo | id=$($new.id)"
  }

  "equipo" {
    "== TEAM'S MEMBERS =="
    $r = Invoke-RestMethod -Method Post -Uri "https://api.notion.com/v1/databases/$DbTeamMembers/query" -Headers $Headers -Body '{"page_size":100}'
    $r.results | ForEach-Object {
      $p = $_.properties
      $tags = ($p.Tags.multi_select | ForEach-Object { $_.name }) -join ", "
      "  {0,-20} | tags={1}" -f (Get-Title $p.Name), $tags
    }
    "== TEAM MEMBER RESPONSIBILITIES =="
    $r2 = Invoke-RestMethod -Method Post -Uri "https://api.notion.com/v1/databases/$DbTeamResponsibi/query" -Headers $Headers -Body '{"page_size":100}'
    $r2.results | ForEach-Object {
      $p = $_.properties
      $resp = Get-RichText $p.Responsiblities
      "  {0,-20} | {1}" -f (Get-Title $p.Name), $resp
    }
  }

  "reglas" {
    "== GUIDE (Scrum SIGEB) =="
    function DumpBlocks([string]$id, [string]$ind) {
      $c = Invoke-RestMethod -Method Get -Uri "https://api.notion.com/v1/blocks/$id/children?page_size=100" -Headers $Headers
      foreach ($b in $c.results) {
        $t = $b.type
        $txt = ""
        if ($b.$t.rich_text) { $txt = ($b.$t.rich_text | ForEach-Object { $_.plain_text }) -join "" }
        if ($txt) { "$ind$($t): $txt" }
        if ($b.has_children -and $t -notmatch "child_") { DumpBlocks $b.id "$ind  " }
      }
    }
    DumpBlocks $PageGuide ""
    "`n== DEFINITION OF READY =="
    DumpBlocks $PageDefinitionOfReady ""
  }
}