import { table } from "../src/lib/table.js";

const data = [
    ["user", "status", "last check-in", "runtime", ""],
    [],
    ["squizzy", "Safe", "06m 41s 0361ms", "04s 0247ms", ""],
    ["katsu", "Safe", "11m 21s 0728ms", "04s 0093ms", ""],
    ["oscilio", "Safe", "03m 07s 0745ms", "03s 0663ms", ""],
    ["arakni", "Safe", "12m 18s 0249ms", "04s 0183ms", ""],
    ["enigma", "Safe", "03m 31s 0794ms", "04s 0244ms", ""],
];

const test = table(data, 100);

test;