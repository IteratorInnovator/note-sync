const STRIP_TAGS_REGEX = /<[^>]*>/g;
const FORBIDDEN_TAGS = ["script", "style", "iframe", "object", "embed"];
const ALLOWED_ATTRS = new Set([
    "class",
    "href",
    "rel",
    "target",
    "data-list",
    "data-indent",
]);

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const removeForbiddenNodes = (root) => {
    root.querySelectorAll(FORBIDDEN_TAGS.join(",")).forEach((node) => {
        node.remove();
    });
};

const cleanAttributes = (element) => {
    [...element.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
            element.removeAttribute(attr.name);
            return;
        }

        if (!ALLOWED_ATTRS.has(name)) {
            element.removeAttribute(attr.name);
            return;
        }

        if (name === "href" && !/^(https?:)?\//i.test(attr.value)) {
            element.removeAttribute(attr.name);
        }
    });
};

export const sanitizeHtmlString = (html = "") => {
    const value = html?.toString() ?? "";
    if (!value.trim()) return "";

    if (!isBrowser) {
        return value
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
            .trim();
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");
    removeForbiddenNodes(doc);
    doc.body.querySelectorAll("*").forEach(cleanAttributes);
    return doc.body.innerHTML.trim();
};

export const getPlainTextLength = (html = "") => {
    const value = html?.toString() ?? "";
    if (!value.trim()) return 0;

    if (!isBrowser) {
        return value.replace(STRIP_TAGS_REGEX, "").trim().length;
    }

    const temp = document.createElement("div");
    temp.innerHTML = value;
    return temp.textContent?.trim().length || 0;
};

export const hasMeaningfulText = (html = "") => getPlainTextLength(html) > 0;
