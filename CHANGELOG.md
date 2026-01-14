# Változási napló

A projekt minden jelentős változása ebben a fájlban lesz dokumentálva.

## [2.2.0] - 2024-08-05

### Javítva
- **Árszámítási hiba:** Az `Ár / kg` és `Ár / méter` mezők közötti kétirányú, valós idejű szinkronizáció most már helyesen működik az eseményfigyelők hozzáadásával. A számítás azonnal megtörténik gépelés közben.

### Módosítva
- **Tiszta indulási állapot:** Az alkalmazás mostantól minden betöltéskor üres számítási mezőkkel indul. A böngésző csak a felhasználói beállításokat (téma, nyelv, kedvencek, egyéni anyagok) tartja meg, a korábbi számítási adatokat nem.
- **Vizuális effektek:** Az összes interaktív ikon (beleértve a lenyitható panelek nyilait is) és a mértékegység-váltók is megkapták az egységes, intenzív "glow" (ragyogás) effektet a konzisztens vizuális visszajelzés érdekében.
- **Felhasználói felület:** A választást segítő felugró ablakok listáiban a korábban kiválasztott elem már nincs vizuálisan kiemelve a letisztultabb és egyszerűbb használat érdekében.

## [2.1.0] - 2024-08-04

### Hozzáadva
- **Árfolyam dátum kijelzése:** Az EUR/HUF árfolyam mező mellett mostantól megjelenik a lekérdezett árfolyam dátuma. Ha az értéket a felhasználó manuálisan módosítja, egy "(kézi)" jelzés jelenik meg.

### Eltávolítva
- **Árfolyamgrafikon:** A grafikon funkció és a hozzá kapcsolódó historikus adatbázis teljes mértékben eltávolításra került az alkalmazás egyszerűsítése és a korábbi betöltési hibák megszüntetése érdekében.

### Javítva
- **"Glow" effektus:** A vizuális "ragyogás" effektus egységesítve lett az összes interaktív elemen, és javítva lett a levágódási hiba a panelek szélein.
- **Adatbetöltés:** Az alkalmazás mostantól minden betöltéskor frissen kéri le az adatfájlokat, megkerülve a böngésző gyorsítótárát.


## [2.0.0] - 2024-08-03

### Hozzáadva
- **Vizuális elválasztók:** A bemeneti és eredmény paneleken belül elválasztóvonalak kerültek bevezetésre a jobb vizuális tagolás érdekében.
- **Összecsukható kategóriák:** Az anyagválasztó felugró ablakban a kategóriák (pl. "Szerkezeti acélok") mostantól összecsukhatók, ami jelentősen javítja a hosszú listák átláthatóságát.
- **Kiterjesztett "Glow" effektek:** A legtöbb interaktív ikon (szerkesztés, törlés, kedvenc stb.) megkapta a jellegzetes ragyogás effektet. Az oldalak közötti átméretező sáv mostantól aktív használat (vonszolás) közben is ragyog.

### Javítva
- **Anyagválasztó túlcsordulás:** Kijavítva a hiba, ami miatt az anyagválasztó ablakban vízszintes görgetősáv jelent meg asztali nézetben.
- **Bemeneti panel térközei:** Növelve lett a térköz a beviteli mezők csoportjai között, így a felület szellősebbé vált, és a "glow" effekt jobban érvényesül.

### Módosítva
- **Dizájnrendszer:** Frissült a belső dizájnrendszer leírása (v3), hogy tükrözze a legújabb vizuális finomításokat.

## [1.9.0] - 2024-08-02

### Javítva
- **Árfolyamgrafikon hiba:** Javítva a hiba, amely miatt az árfolyamgrafikon nem jelent meg a felugró ablakban.
- **Dizájn egységesítése:** Az árfolyamgrafikont tartalmazó felugró ablak dizájnja egységesítve lett az alkalmazás többi modális ablakával.

### Módosítva
- **Intenzívebb vizuális effektek:** Az összes interaktív elemen (gombok, beviteli mezők, listaelemek, eredmény-dobozok) jelentősen megnöveltük a `hover` és `focus` állapotoknál a "glow" (ragyogás) effektjét.
- **Szöveg-kiemelés:** Sötét módban a `hover` állapotú elemek szövege mostantól ragyogó hatást kap (`text-shadow`), és az elemek enyhén meg is nőnek (`transform: scale`), hogy "kiugorjanak" a felületből.
- **Elrendezés finomítása:** A "Teljes test értékei" szekcióban javítva a belső térközökön a jobb olvashatóság érdekében.

## [1.8.0] - 2024-08-01

### Hozzáadva
- **Egységes modális választó ablak:** A terméktípus, anyag és szabványméret választók lecserélve egyetlen, felugró ablakos megoldásra a jobb használhatóság és egységesebb megjelenés érdekében.
- **Beépített kereső:** Minden választó ablak kapott egy keresőmezőt, ami megkönnyíti a hosszú listákban való navigációt.

### Módosítva
- **Felhasználói felület egyszerűsítése:** A korábbi, egyedi legördülő menük teljes mértékben eltávolításra kerültek.

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
- **UI:** Responzív, kétoszlopos elrendezés, sötét/világos téma, magyar és angol nyelvi támogatás.