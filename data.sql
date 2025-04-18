-- command to insert bulk data from CSV to PosteSQL via PSQL CLI
\copy products(title, price, category, label, description, quantity, image1, image2, image3, image4, btn_color1, btn_color2, btn_color3, btn_color4) FROM 'D:\Work\Coding-Practice\ALL-Ecosystems\Hobby-Projects\1-REACT\sneakpick\nike-data.csv' DELIMITER ',' CSV HEADER;
