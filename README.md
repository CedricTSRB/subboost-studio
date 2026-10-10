# Goal Overlays – Twitch Overlay Designer

Ein eigenständiger, kostenlos hostbarer Webseiten-Prototyp für Twitch-Overlay-Gestaltung. Keine Base44-Abhängigkeit. Alle Dateien selbst bearbeiten.

## Bereits eingebaut
- Professionelles responsives Dashboard ohne Neon als Standard-Oberfläche
- Sieben verschiedene Overlay-Designs: Neon, Glas, Fill, Sharp, Outline, Transparent, Eigenes Bild
- Live-Vorschau, unabhängige Akzentfarbe, eigener Titel, Bildhintergrund
- Getrennte Abo- und Follower-Ziele mit aufwärts laufenden Zählern
- Test-Buttons für neue Follows und Subs (kein Twitch-Zugriff erforderlich)
- Countdown-Timer (12, 24, 48 oder eigene Stunden), Start/Pause/Reset
- OBS-Browser-Links für einzelne Widgets oder das komplette Overlay
- Lokale Speicherung in deinem Browser ohne Account
- Separates StreamElements-Custom-Widget mit Twitch-Sessionwerten und Follower-/Subscriber-Events unter `streamelements/`

## Wichtige Grenze: Synchronisierung
Die GitHub-Pages-Webseite ist **statisch**. Sie zeigt manuell eingestellte Testwerte. Der Link nach OBS enthält einen **Schnappschuss** der Einstellungen; spätere Dashboard-Änderungen und Counter-Updates in einem anderen Browser synchronisieren sich nicht automatisch. Die lokale Uhr kann im OBS-Overlay per Rechtsklick > Interagieren > Timer Start/Pause/Reset gesteuert werden; die unabhängige Timer-Instanz in deinem normalen Browser wird nicht mitgesteuert.

**Echte Twitch-Follows und Subs** sind über das separate **StreamElements-Custom-Widget** vorgesehen; dafür muss StreamElements mit Twitch verbunden und der Code einmal ins Custom Widget eingefügt werden. Dieses Widget übernimmt seine Zielwerte aus StreamElements-Feldern, nicht aus den GitHub-Pages-Einstellungen. Es ist vorbereitet, aber ohne echten Kanal noch nicht live getestet.

## Webseite kostenlos auf GitHub Pages veröffentlichen
1. Das bereits angelegte **öffentliche Repository** `CedricTSRB/subboost-studio` öffnen.
2. Im Repository **Add file → Upload files** wählen. Das ZIP-Paket zuerst entpacken und die Dateien `index.html`, `styles.css`, `app.js`, `README.md` sowie den Ordner `streamelements` **direkt in das Stammverzeichnis** hochladen (nicht den äußeren Ordner `SubBoost-GitHub-Upload`). Änderungen mit **Commit changes** speichern.
3. Im Repository auf **Settings → Pages → Build and deployment → Deploy from a branch** gehen. Branch `main`, Ordner `/(root)` wählen und **Save** drücken.
4. Die Seite ist anschließend unter `https://cedrictsrb.github.io/subboost-studio/` erreichbar, sofern das Repository genau so heißt. (Gegebenenfalls muss GitHub Pages erst bereitgestellt werden.)
5. Goal Overlays auf der veröffentlichten Seite öffnen, Design auswählen, Ziele einstellen und OBS-Links kopieren. Falls die Seite noch nicht erreichbar ist, die Veröffentlichung unter **Actions** bzw. **Settings → Pages** prüfen. In OBS **Quellen → + → Browser → URL einfügen**.

Wichtig: GitHub Pages ist öffentlich. Niemals Twitch-/StreamElements-API-Tokens oder andere geheime Zugangsdaten in dieses Repository hochladen.

## Live-Verbindung mit StreamElements einrichten
1. Twitch in [StreamElements](https://streamelements.com/) verbinden.
2. Unter **My Overlays** ein Overlay erstellen und ein **Custom Widget** hinzufügen.
3. Widget → **Open Editor**: Den Inhalt von `streamelements/HTML.html` in **HTML**, `CSS.css` in **CSS**, `JS.js` in **JS** und `FIELDS.json` in **FIELDS** kopieren.
4. Änderungen speichern, im Widget-Editor Ziele und Stil einstellen.
5. Das StreamElements-Overlay in OBS als **Browser-Quelle** einfügen. Dann kommen die Zähler aus der Twitch/StreamElements-Session.
6. Timer in der StreamElements-Widget-Bedienung über die Buttons in den FIELDS starten/pausieren oder zurücksetzen. Er wird über den StreamElements-Store gespeichert.

### Besonderheit von Zielen
Das StreamElements-Widget zählt wahlweise **Sessionwerte** (seit Sessionbeginn) oder **Gesamtzahlen**. Im Widget unter `Werte zählen` auswählen. Zusätzliche Startwerte ermöglichen individuelle Kampagnenziele. Gift Subs und Resubs werden gemäß den von StreamElements gelieferten `subscriber-session`-Zahlen verarbeitet. Prüfe den gewünschten Zählmodus bei deinem Stream.

Technische Referenzen:
- https://docs.streamelements.com/overlays/events
- https://docs.streamelements.com/overlays/session-data
- https://docs.streamelements.com/overlays/custom-widget
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Lokal benutzen
`index.html` per Doppelklick im Browser öffnen. Für verlässlich nutzbare OBS-Links bitte erst auf GitHub Pages veröffentlichen.
