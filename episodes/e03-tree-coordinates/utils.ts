import { v5 as sha1 } from "uuid";

const hashNamespace = "c6443dd4-6c04-4838-b571-fd75b3cce1a4";

export const getHash = (str: string) => sha1(str, hashNamespace);
