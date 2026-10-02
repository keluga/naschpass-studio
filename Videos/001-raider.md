---
status: entwurf
vorlage: nostalgie
stimme: Puck
stil: "warm und begeistert, wie ein Freund, der eine Kindheitserinnerung erzählt; kleine Pausen, am Ende neugierig fragend"
fakten:
  - "[[twix-hiess-raider-bis-1991]]"
  - "[[raider-im-norden-bis-2000]]"
caption: "1991 war Schluss mit Raider. Im Norden hat der Name noch bis 2000 durchgehalten 🍫 Sagst du heute noch Raider? 👇"
hashtags: [naschpass, nostalgie, raider, twix, süßigkeiten, 90er]
video: ""
gerendert_am: ""
gepostet_am: ""
---
# Raider: der Name, der 1991 verschwand

**Gefühl:** Nostalgie. **Ziel:** Kommentare („Raider oder Twix?“).

## Szenen
Jede Szene: `sag` = gesprochener Text, `zeig` = was im Bild passiert.

```yaml
- sag: "Zurück ins Jahr 1991."
  zeig: {"type": "yearRoll", "from": 2026, "to": 1991, "label": "Zurück ins Jahr"}
- sag: "Damals verschwand ein Name, den du vielleicht noch kennst: Raider."
  zeig: {"type": "bigWord", "word": "RAIDER", "bar": true}
- sag: "Aus Raider wurde Twix."
  zeig: {"type": "swap", "label": "1991", "oldWord": "RAIDER", "newWord": "TWIX"}
- sag: "Der Grund: Twix sollte international gleich heißen."
  zeig: {"type": "statement", "lines": ["Der Grund:", "Ein Name,", "international."], "accent": 2}
- sag: "Im Norden hielt Raider sogar bis 2000 durch."
  zeig: {"type": "statement", "lines": ["Im Norden:", "bis 2000."], "accent": 1}
- sag: "Und jetzt mal ehrlich: Sagst du heute noch Raider? Schreib's in die Kommentare."
  zeig: {"type": "question", "word": "RAIDER?", "options": ["RAIDER", "TWIX"]}
```

## Notizen
