CascadingDropdown
=================

A JSON driven Javascript UI component, this cascading dropdown can be used to guide user through a series of selections where each subsequent set of options in the selection process depends on the previous.
  
Consider a scenario where you want to present a user with a list of products to choose from. If the list is long, you might want to categorize the products using some sort of taxonomy and use the categorizations to filter the choice sets. For example you might have a taxonomy like:

pets
  - dogs
     - dachshund
     - greyhound
     - dalmation
  - cats
    - calico
    - siamese
  - snakes
    - boa constrictor
    - python

The Cascading Dropdown component enables the development of a taxonomy like this using JSON to drive a set of javascript cascading dropdown lists. 

To use the component simply:

0. Create a JSON configuration file with your taxonomy.

1. Add a uniquely id'd div element to your HTML (the cascade container).

2. Include the Cascade Dropdown component script on the containing page.

3. Create a Cascade object using the JSON configuration.







