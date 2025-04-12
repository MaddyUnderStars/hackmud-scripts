import * as v from "../src/lib/validation.js";

const schema = v.object({
    sort_dir: v.number().refine(d => d === -1 || d === 1).optional(),
    sort: v.string().array().or(v.string().map(d => ([d]))).optional([]),
    page: v.number().min(0).optional(0),
    page_size: v.number().min(1).optional(50),
});

const ret = schema.parse({ page: -1 });