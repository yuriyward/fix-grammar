bylem w drodze do Krakowa, thx za linki
Wlasnie chialem pytac w sprawie temporal, w tej chwili jest hostowany na serwerze, i tam jest jakas konfiguracja, ktora usuwa wsz odpalenia po jakims czasie?
Chialbys przerzucic sam workflow na temporal z prefetch rowniez?

Gemini troche zachowuje to co go sie prosi, ale nie jest dobry w zachowaniu struktury, bardziej z grubsza jest w stranie ocenic rozne aspekty.

Dobrze, czyli pociąg bezie na 14:15?
Sa tramwaje ktore jada prosto do mnie, to mozemy odrazu przy przystanku spotkac się

https://maps.app.goo.gl/WC7pDHr3KFSWgMAp8?g_st=ipc


Dzis sprawdzalem apply_patch, tak jak rekomenduje openai (okazuje sie ze to inny format niz uzywany w codex), i on calkiem spoko jest, problem ktory zauwazylem, jest z testami lub promptem wedlug mnie.
Np. jest test na ktorym on sie zawsze wywala project_plan
```
The test fixture fixtures/simple/project_plan.changes.md has an ambiguous instruction that tells the model to add "2. Review budget allocation" literally, but expects implicit renumbering of subsequent items (2→3, 3→4, 4→5).
```
I tu mozna na dwa sposoby to obejsc, albo prompt ktory definiuje co ma byc zmienione, bedzie uwzgledniac takie wymagania, i bedzie dawac jasne instrukcje, albo my zmieniamy prompt w apply_patch, aby takie rzeczy sam ogarnial, i zeby pilnowal list

Ja zmienilem prompt dodajac jenda linijke polecenia i odrazu zaczal zawsze przechodzic
