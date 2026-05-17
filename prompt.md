# App technical specification 
1. Build a API-less full web application
2. Use RadixUI, Redux Toolkit
3. Has no API, everything done on client side
4. Should support build which results in single runnable/usable HTML file

# App purpose
- Create sample data for screening system testing
- Samples contain good and bad actors
- Samples are produced in SEPA SCT INST (instant payment) format (.xml files)
- Sampels can be produced in .csv where each row contains single payment (base64 encoded)

# User stories
1. As user i want to load .csv file of person Names
2. As user i want to load .csv file of person Surnames
3. As user i want to be able to generate defined number of synthetic full name pairs (using provided names surnames)
4. As user i want to load .csv file of company names
5. As user i want to load .csv file of BIC codes
6. As user i want to load .csv file of addresses and countries (2 lists)
7. As user i want to generate SEPA SCT INST payment sample which uses randomized pairs of persons, companies, bic codes, addresses and countries
8. As user i want to export .zip with SEPA .xml files
9. As user i want to export .csv with SEPA messsages (1 per row) in base64 encoding
