# Változási napló

A projekt minden jelentős változása ebben a fájlban lesz dokumentálva.

## [1.7.0] - 2024-07-31

### Eltávolítva
- **Műszaki rajz funkció:** A felhasználói visszajelzések és a funkció implementációs nehézségei miatt a dinamikus műszaki rajz panel teljes mértékben eltávolításra került. Ez jelentősen egyszerűsíti a felhasználói felületet és a kódbázist.

## [1.6.1] - 2024-07-31

### Javítva
- Kritikus hiba javítása, amely megakadályozta az alkalmazás megfelelő működését. A `product-type-select` elem cseréje miatti JavaScript hiba (`null reference`) elhárítva, ami miatt a dinamikus tartalmak (méretmezők, anyagszűrés, számítások) és a feliratok nem töltődtek be.

## [1.6.0] - 2024-07-31

### Hozzáadva
- **Professzionális Műszaki Rajzok:** Az összes terméktípushoz tartozó SVG ábra újratervezve a műszaki rajz szabványainak megfelelően. A méretvonalak és jelölések már nem metszik a testet.
### Módosítva
- **Egységes UI:** A "Terméktípus" és "Szabványméret" választók is megkapták az egyedi, modern legördülő menü stílust. A beviteli mezők és legördülők zöld "glow" effektet kaptak a jobb vizuális visszajelzés érdekében.

## [1.4.0] - 2024-07-30

### Hozzáadva
- **Inch/mm Konverzió Csöveknél:** A "Cső" terméktípusnál a külső átmérő és a falvastagság mértékegysége egymástól függetlenül váltható `mm` és `inch` között. A számítás kezeli a vegyes mértékegységeket is.
- **Egyenlőtlen Szárú L-szelvények:** A szabványos szelvények listája bővült az egyenlőtlen szárú L-profilokkal.

### Módosítva
- **Alapból Csukott Anyagcsoportok:** Az anyagválasztóban a kategóriák (pl. "Szerkezeti acélok") alapértelmezetten csukva vannak a jobb átláthatóság érdekében. A "Kedvencek" és "Saját anyagok" továbbra is nyitva maradnak.
- **Világos Téma Dizájn:** A világos mód is a Seattle Seahawks színeit használja (szürke háttér, sötétkék szövegek, zöld kiemelések), egységesítve az alkalmazás megjelenését.

## [1.3.0] - 2024-07-29

### Hozzáadva
- **Új dizájn:** Az alkalmazás teljes felülete a Seattle Seahawks csapatszíneit kapta meg (Navy, Action Green, Wolf Gray).
- **Új terméktípus:** L-szelvény (Szögvas) hozzáadva, számítással és szabványméretekkel.
- **Verziókövetés:** Megjelenik a verziószám a láblécben.
- **Changelog:** Ez a fájl a változások követésére.
- **Hossz-konverzió:** A hossz mértékegységének (mm/m) váltásakor a beírt érték is automatikusan átváltásra kerül.

### Módosítva
- **UI Elrendezés:** A méret-beviteli mezők a terméktípus választó alá kerültek a logikusabb munkafolyamat érdekében.
- **Terminológia:** A terméktípusok nevei anyagsemlegesek lettek (pl. "Köracél" -> "Kör szelvény").
- **Tiszta Indítás:** Az alkalmazás minden induláskor törli az előzőleg beírt méretadatokat.
- **Lábléc:** A lábléc mostantól mindig az oldal alján helyezkedik el, függetlenül a tartalom magasságától.
- **Szabványméretek:** Bővült az IPE, HEA, HEB, UNP szelvények szabványméret listája.

## [1.2.0] - 2024-07-28

### Hozzáadva
- **Hossz Mértékegység Váltó:** A "Hossz" mezőhöz `mm` és `m` közötti váltó gomb került. A számítások figyelembe veszik a kiválasztott mértékegységet.

## [1.1.0] - 2024-07-27

### Módosítva
- **Felhasználói élmény javítása:** A "Hossz" beviteli mező már akkor aktívvá válik, ha a méterenkénti tömeg kiszámítható, függetlenül a teljes test értékeitől, így a munkafolyamat logikusabb lett.

## [1.0.0] - 2024-07-26

### Hozzáadva
- **Projekt inicializálása:** Létrejött a Metal Calculator alapalkalmazás.
- **Alapfunkciók:** Anyag- és terméktípus választás, méretek megadása.
- **Számítások:** Keresztmetszet, méterenkénti és teljes tömeg, felület és ár számítása.
- **Haladó funkciók:** Egyedi anyagok kezelése, kedvencek rendszere, HUF/EUR valutaváltó árfolyamgrafikonnal.
- **UI:** Reszponzív, kétoszlopos elrendezés, sötét/világos téma, magyar és angol nyelvi támogatás.