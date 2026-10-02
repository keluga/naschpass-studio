# Anleitung

## So entsteht ein Video
1. **Idee:** steht in [[Ideen]]. Neue Ideen einfach unten anhängen.
2. **Skript:** Claude schreibt beim Monatslauf aus den Ideen fertige Video-Notizen in `Videos/` (Status `entwurf`) und legt die Belege in `Fakten/` an. Jeder Fakt wird von einem zweiten Agenten unabhängig gegengeprüft.
3. **Freigabe:** Du liest die Notiz. Passt alles, setzt du `status: fertig`.
4. **Bauen:** GitHub erzeugt Stimme, Untertitel und Video automatisch. Danach steht in der Notiz `status: gerendert` und unter `video` der Download-Link.
5. **Posten:** siehe unten. Danach `status: gepostet` und `gepostet_am: JJJJ-MM-TT` eintragen.

## Posten (TikTok / Instagram)
1. Im Cockpit auf „Video holen“ tippen und die MP4 herunterladen. Die `caption.txt` liegt daneben.
2. In der App hochladen und einen **Trend-Sound aus der App-Bibliothek** sehr leise unter die Stimme legen (Lautstärke etwa 10–15 %).
3. Caption aus `caption.txt` einfügen. Quellen und Bildnachweise müssen drinbleiben.
4. Wenn die App einen Schalter „KI-generierter Inhalt“ anbietet: einschalten, denn die Stimme ist KI.

## Status-Werte
| Status | Bedeutung |
| --- | --- |
| `entwurf` | Skript liegt vor, wartet auf deine Freigabe |
| `fertig` | freigegeben, wird gebaut |
| `gerendert` | Video ist fertig, Link unter `video` |
| `gepostet` | ist online |

## Wenn etwas schiefgeht
Auf https://github.com/keluga/naschpass-studio/actions steht beim roten Lauf, was fehlt (zum Beispiel ein ungeprüfter Fakt oder eine Bildlizenz). Sag Claude Bescheid und füge die Meldung ein.
