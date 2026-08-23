# Regional Food Carbon Dataset Notes

## Candidate One: Pan Asian Dish Level Carbon and Nutrition Dataset

Source: https://www.nature.com/articles/s41597-025-06180-5

The Scientific Data article describes a Pan Asian dataset of 4,403 dishes from 48 countries and regions. It models dish carbon footprints from ingredients, seasonings, and cooking energy, and describes a cradle to consumer assessment. It states that data records are available on Figshare and include dish information, carbon footprints, nutrition, cuisine type, and serving basis.

The linked Figshare dataset is public under CC BY 4.0 and publishes a `GHG` table. Its field documentation specifies separate ingredient and cooking process emissions in gCO2e per serving. PlateFootprint converts the total of these two fields from gCO2e to kg CO2e per serving.

Import boundary: values from this dataset must be labelled as Pan Asian research, not as Singapore IPUR research. Only records with a clear dish name, country, serving basis, and downloadable source value can be added to PlateFootprint. A small curated group of familiar dishes will be imported first rather than all 4,403 records, so student search and source explanations remain clear.

Curated records selected from the public `Asia_recipes_GHG.xlsx` data file:

| Dish | Country | Source record | Total gCO2e per serving | App value kg CO2e per serving |
|---|---|---:|---:|---:|
| Thai Tom Yum Gong Soup | Thailand | 696 | 1084.76 | 1.08 |
| Thai Green Curry Chicken | Thailand | 694 | 736.56 | 0.74 |
| Nasi Goreng Kambing | Malaysia | T2550 | 559.26 | 0.56 |
| Beef Rendang | Indonesia | E2395 | 2440.41 | 2.44 |
| Vietnamese Chicken Pho | Vietnam | 671 | 478.80 | 0.48 |
| Chicken Adobo | Philippines | 654 | 266.83 | 0.27 |
| Korean Spicy Fried Chicken | South Korea | 653 | 174.68 | 0.17 |
| Butter Chicken | India | E1365 | 700.45 | 0.70 |
| Chana Masala | India | 1085 | 246.12 | 0.25 |
| Kung Pao Chicken | China | 391 | 339.65 | 0.34 |

## Candidate Two: Asian Dish Carbon, Price and Nutrition Inventory

Source: https://figshare.com/articles/dataset/Sustainable_diet_c_b_arbon_footprint_price_and_nutrition_intake_inventory_of_1_182_Asian_dishes_b_/25999843

The public Figshare listing describes a 1,182 Asian dish inventory. The interactive page did not provide readable metadata in browser review. Its API metadata and downloadable files must be checked before any record is imported.

API review confirmed that this listing now supplies the version three 4,403 dish dataset described above. It is the selected regional source for this update. The separate 1,000 Cantonese and Sichuan dish dataset was researched as a potential second source but is not being imported in this release because the Pan Asian source already supplies comparable documented records and prevents overlapping regional recipe values from being mixed without a defined reconciliation rule.

## Existing Singapore Boundary

The IPUR NUS article continues to supply only three directly published Singapore dish values. Regional data must remain separate in the user interface and source notes.
