# Naschpass Cockpit

**Freigeben:** Video-Notiz öffnen und `status` von `entwurf` auf `fertig` stellen. Obsidian lädt die Änderung innerhalb von 5 Minuten hoch, sofort geht es mit `Strg+P` → „Git: Commit and sync“. Etwa 10 Minuten später steht das Video unten unter „Bereit zum Posten“.

## Zum Freigeben
```dataview
TABLE WITHOUT ID file.link AS "Video", vorlage AS "Vorlage", caption AS "Caption"
FROM "Videos"
WHERE status = "entwurf"
SORT file.name ASC
```

## Wird gerade gebaut
```dataview
TABLE WITHOUT ID file.link AS "Video", vorlage AS "Vorlage"
FROM "Videos"
WHERE status = "fertig"
SORT file.name ASC
```

## Bereit zum Posten
```dataview
TABLE WITHOUT ID file.link AS "Video", gerendert_am AS "Gebaut am", elink(video, "Video holen") AS "Download"
FROM "Videos"
WHERE status = "gerendert"
SORT gerendert_am DESC
```

## Gepostet
```dataview
TABLE WITHOUT ID file.link AS "Video", gepostet_am AS "Gepostet am"
FROM "Videos"
WHERE status = "gepostet"
SORT gepostet_am DESC
```

## Fakten, die noch geprüft werden
```dataview
TABLE WITHOUT ID file.link AS "Fakt", aussage AS "Aussage"
FROM "Fakten"
WHERE status = "entwurf"
```

## Abgelehnte Fakten
```dataview
TABLE WITHOUT ID file.link AS "Fakt", notiz AS "Grund"
FROM "Fakten"
WHERE status = "abgelehnt"
```

---
[[Ideen]] · [[Anleitung]]
