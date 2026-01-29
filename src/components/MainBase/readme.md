## Main Base

On click on an building, show AvailableMainBuildings Component (you'll have to build it)
This will be a new component acting as an overlay, a click outside of it close it.
The overlay will be a black/50 centered div 80% the size of the parent Main-Base container
The list of buildings should only show:
- the availables buildings for the current selectedFaction (see store)
- minus the ones already present in the main base
- + A cross Icon to reset the current building to false (empty)
We need first to build the data of the main buildings available.
You can find uncleaned data in res/assets/buildings.xml
Propose me a clean json format to convert those too right now, not in a script.
Props i'm interested in:
  - texts.name
  - the desc of the attributes.

How to know which buildings i'm intersted to ?
- Their name Start with Main_
- If a main building is unique to a Faction it will end with the Faction name, like Main_Embassy_Fremen, for example.
You can find all the factions names in the store.

We'll do this job in 2 steps, the pruning of the xml file, and the component.
Create a new component called MainBaseBuildingsSelector. Then works in it, i want the tsx component and the json file we'll created. 

Any questions?