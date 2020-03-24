## System Overview

The system allows volunteers to contribute reading data. Data is collected via the Mouse-Contingent Reading NLG evaluation method (Zarrieß, S.,Loth, S., and Schlangen, D).

Researchers may upload texts to be assigned to volunteers, compare texts based on collected reading data and receive customised data-analyses.

## Hosting Instructions

This repository is shared under the [Apache 2.0 license](https://www.apache.org/licenses/LICENSE-2.0.html). Modification, redistribution and personal use are permitted in accordance with this license.

### Server Requirements

The host server must be set up to run PHP scripts and host MySQL databases. Scripts are confirmed to work with PHP version 7.3.15. Database queries are confirmed to work with MySQL version 5.6.41.

### System Setup

1. Edit the *private/config.php* file to match your database and account information.
2. Run the script in *private/setup/tables.php*. If no error messages appear, your system should be set up and ready for use!

## References

Zarrieß, S.,Loth, S., and Schlangen, D. 2015. "Reading Times Predict the Quality of Generated Text Above and Beyond Human Ratings". In Proceedings of the 15th European Workshop on Natural Language Generation (ENLG), pages 38–47, Brighton, September 2015. Published by the Association for Computational Linguistics.
