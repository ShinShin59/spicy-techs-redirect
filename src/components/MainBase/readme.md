### MainBase

Component used to load faction layout of main base buildings.
The container is css grid of 384x320. One main base buildings is a square of 64x64.
The layouts are multidimensionnal arrays representing the number of main buildings and their position.
The first array is the first row, second array second row, etc.. max 3 row.
The main buildings should be centered evenly. See examples in the fodler res/pruned/main_base_layouts 
The components should only take one prop, the layout choosen, and should render the grid with correctly possitionned main buildings (use simple white square for now)