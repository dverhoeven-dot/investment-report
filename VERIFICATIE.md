# Controle van de integratie

Uitgevoerd op Node.js 24 met Next.js 16.2.9:

- Productiebuild met webpack: geslaagd.
- TypeScript-controle: geslaagd.
- Tien account-/rechtentests: geslaagd. Deze controleren hashing, beperkte routes en foto's, onbekende routes, read-only API-rechten, sessies, beheerrollen, zelfbescherming, dubbele e-mails, ongeldige rechten, blokkeren, wachtwoordwijzigingen, gelijktijdige wijzigingen, verwijderen en persistente inloglimieten.
- Twee gegevenstests: geslaagd. Deze controleren de bestaande CSV-parser/landherkenning en dat de Nederlandse respons buitenlandse objecten, buitenlandse financieringen en algemene financiële tabellen weglaat.
- Nieuwe portaalmodules, nieuwe API, instelscripts en portaaltests: lint zonder fouten of waarschuwingen.
- Interactieve terminalinstelling: naam/e-mailadres invoeren, verborgen wachtwoord tweemaal invoeren, database initialiseren en eerste medewerker aanmaken: geslaagd.
- HTTP-integratietest van de productieversie: geslaagd. Gecontroleerd: medewerkerbeheer, het gefilterde portaal, de read-only melding op bestaande externe pagina's, directe pagina-/API-/QA-/foto-blokkades, blokkeren van alle bestaande schrijvende API-methoden, afwijzen van vervalste `internal`-vlaggen en edit-tokens, same-origin controle voor medewerkersmutaties, uitgeschakelde image optimizer en directe blokkering van een bestaande sessie.

Het hele aangeleverde project had vóór de integratie 21 lintfouten. Het geïntegreerde project heeft dezelfde 21 fouten; het betreft onder andere bestaande React-effecten, variabelen in renderfuncties en twee bestaande `any`-typen. De oorspronkelijke versie had 33 waarschuwingen en de aangepaste versie 41, waaronder bestaande helpers die na het verplaatsen van parsing niet meer door de client worden gebruikt. Die bestaande code is niet inhoudelijk herschreven om louter de lintregels tevreden te stellen.

Er zijn geen productiegegevens gewijzigd. Supabase-/Google-geheimen, de public-map en een echte Turso-configuratie waren niet meegestuurd. Het succesvol laden en opslaan van echte upstreamgegevens moet daarom nog lokaal met de bestaande instellingen en vervolgens op een preview worden gecontroleerd. De controle testte blokkades vóór upstreamtoegang; voor een toegestane API-aanvraag zonder productieconfiguratie werd de verwachte configuratiefout bereikt.

Er is geen visuele browsercontrole uitgevoerd: de beschikbare testbrowser kon niet worden gedownload. De pagina's zijn wel als HTTP-respons van de productieversie gecontroleerd. Controleer zelf lokaal de vormgeving, afbeeldingen, filterbediening, printen en de readonly invoervelden.

Geen commit, push of deployment uitgevoerd. Lokale testaccounts, testdatabases, sessietokens, .env-bestanden, node_modules en buildbestanden zitten niet in het opgeleverde pakket.

## Zelf herhalen

```bash
npm run test:portal
npm run test:gegevens
npx tsc --noEmit
npm run build
```

De integratie volgt de meegeleverde Next.js-handleidingen voor rechtencontrole bij gegevens, serveracties en routehandlers. De proxy is een aanvullende navigatiecontrole; iedere bestaande API controleert zelf opnieuw de gebruiker en diens rechten.
