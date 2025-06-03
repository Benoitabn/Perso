<?php
//Fonction pour afficher la direction du vent
function directionVent($angle) {
    switch (true) {
        case ($angle >= 348 || $angle < 12.25):
            return "NORD";
        case ($angle >= 12.25 && $angle < 34.75):
            return "NORD-NORD-EST";
        case ($angle >= 34.75 && $angle < 57.25):
            return "NORD-EST";
        case ($angle >= 57.25 && $angle < 79.75):
            return "EST-NORD-EST";
        case ($angle >= 79.75 && $angle < 102.25):
            return "EST";
        case ($angle >= 102.25 && $angle < 124.75):
            return "EST-SUD-EST";
        case ($angle >= 124.75 && $angle < 147.25):
            return "SUD-EST";
        case ($angle >= 147.25 && $angle < 169.75):
            return "SUD-SUD-EST";
        case ($angle >= 169.75 && $angle < 192.25):
            return "SUD";
        case ($angle >= 192.25 && $angle < 214.75):
            return "SUD-SUD-OUEST";
        case ($angle >= 214.75 && $angle < 237.25):
            return "SUD-OUEST";
        case ($angle >= 237.25 && $angle < 259.75):
            return "OUEST-SUD-OUEST";
        case ($angle >= 259.75 && $angle < 282.25):
            return "OUEST";
        case ($angle >= 282.25 && $angle < 304.75):
            return "OUEST-NORD-OUEST";
        case ($angle >= 304.75 && $angle < 327.25):
            return "NORD-OUEST";
        default:
            return "NORD-NORD-OUEST";
    }
}
?>