Mám cityJSON.
Chci pole s objekty, kde každý objekt bude buďto 3D objekt, čára, plocha, nebo bod.

### 3D objekt 
* chci pole trohjuhelníků, nasypat vertexy za sebe do pole, tak aby se to dalo nasypat přímo do WebGL, pro každý trojúhelník normály (tím pádem bude potřeba bez indexování) 

    [v1, v2, v3, v4, v5, v6 ...]
    [n1, n1, n1, n2, n2, n2 ...]

* k tomu objekt (slovník) s metadaty
* pro objekt bounding box
* v případě že mám v cityjsonu objekt z více částí (v potomcích je parent s id rodiče), tak chci jejich geometrii spojit dohromady
* geometrii je potřeba vytriangulovat!! - v cityjsonu bývají 4úhelníky apod.

### plocha
* vytriangulovaná polcha, geometrie uložená analogicky jako objekt
* geometrii budu potřebovat rozdělit do "rastru", abych ji mohl transformovat pomocí displacementu (potřebuju tam geometrii pro displacement)
* metadata jako slovník

### lomená čára 
* geometrie tak, abych měl vždy za sebou počáteční a koncový vertex segmentu, budou se tedy opakovat ve spojích (jedu po dvojicích)

    [v1, v2, v2, v3, v3, v4]

* analogicky k tomu metadata jako slovník

### body
* easy - vektor 3 složek + metadata

Jak to udělám s co nejmenším úsilím?