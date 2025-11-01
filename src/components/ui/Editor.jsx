import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

const MODULES = {
    toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
    ],
    clipboard: { matchVisual: false },
};

const FORMATS = ["bold", "italic", "underline", "list"];

const Editor = forwardRef(({
    initialHtml = "",
    placeholder = "",
    maxLength,
    className = "",
    readOnly = false,
    resetSignal,
    onChange,
}, ref) => {
    const options = useMemo(
        () => ({
            theme: "snow",
            modules: MODULES,
            formats: FORMATS,
            placeholder,
            readOnly,
        }),
        [placeholder, readOnly]
    );

    const { quill, quillRef } = useQuill(options);
    const toolbarRef = useRef(null);
    const prevHtmlRef = useRef("");
    const didInitRef = useRef(false);
    const resetSignalRef = useRef(resetSignal);

    useEffect(() => {
        if (!quill || didInitRef.current) return;
        const html = initialHtml || "";
        prevHtmlRef.current = html;
        quill.clipboard.dangerouslyPasteHTML(html);
        didInitRef.current = true;
    }, [quill]); // <-- no initialHtml

    useEffect(() => {
        if (!quill) return;

        const handleChange = () => {
            const html = quill.root.innerHTML;
            const len = quill.getText().trim().length;

            if (maxLength && len > maxLength) {
                quill.clipboard.dangerouslyPasteHTML(prevHtmlRef.current || "");
                quill.setSelection(quill.getLength(), 0);
                return;
            }

            prevHtmlRef.current = html;
            onChange?.({ html, plainTextLength: len, quill });
        };

        quill.on("text-change", handleChange);
        return () => quill.off("text-change", handleChange);
    }, [quill, maxLength, onChange]);

    useEffect(() => {
        if (!quill) return;
        if (resetSignal === undefined) {
            resetSignalRef.current = resetSignal;
            return;
        }
        if (resetSignalRef.current === resetSignal) return;

        resetSignalRef.current = resetSignal;
        quill.setText("");
        quill.setSelection(0, 0);
        prevHtmlRef.current = "";
    }, [quill, resetSignal]);

    useImperativeHandle(
        ref,
        () => ({
            focus: () => {
                quill?.focus();
            },
            getQuill: () => quill ?? null,
        }),
        [quill]
    );

    return (
        <div className={`w-full min-w-0 ${className}`}>
            <div
                ref={quillRef}
                className="
        block w-full min-w-0 max-w-none
        [&_.ql-toolbar]:bg-slate-300/80
        [&_.ql-container]:w-full [&_.ql-container]:min-w-0
        [&_.ql-editor]:whitespace-pre-wrap [&_.ql-editor]:break-words [&_.ql-editor]:[overflow-wrap:anywhere]
        [&_.ql-editor]:min-h-[10rem] md:[&_.ql-editor]:min-h-[8rem]
        [&_.ql-editor]:max-h-[55vh] lg:[&_.ql-editor]:max-h-[65vh]
        [&_.ql-editor]:overflow-y-auto
      "
            />
        </div>
    );
});

Editor.displayName = "Editor";

export default Editor;
