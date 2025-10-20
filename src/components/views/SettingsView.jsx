import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    ChevronDown,
    CircleCheck,
    CircleX,
    Trash2,
    X,
    RotateCcw,
    Settings2,
} from "lucide-react";
import { DEFAULT_SETTINGS, useSettings } from "../../stores/useSettings";
import { auth } from "../..";
import { deleteUser } from "firebase/auth";
import { useDebounce } from "../../hooks/useDebounce";
import {
    getUserSettings,
    updateUserSettings,
    resetUserSettings,
    deleteAllVideos,
} from "../../utils/utils/firestore";
import { ToastContainer } from "../ui/Toast";

const safeSearchOptions = [
    { value: "strict", label: "Strict (hide mature content)" },
    { value: "moderate", label: "Moderate (default)" },
    { value: "none", label: "None (show all results)" },
];

const videoDurationOptions = [
    { value: "any", label: "Any length" },
    { value: "long", label: "Long (20+ minutes)" },
    { value: "medium", label: "Medium (4-20 minutes)" },
    { value: "short", label: "Short (<4 minutes)" },
];

const SectionCard = ({ title, description, children }) => (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="divide-y divide-slate-100">{children}</div>
    </section>
);

const Row = ({ title, description, control }) => (
    <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h3 className="text-sm font-medium text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="sm:flex-shrink-0">{control}</div>
    </div>
);

const DangerSection = ({ title, description, children }) => (
    <section className="rounded-2xl border border-red-200 bg-red-50/80 ring-1 ring-red-100/80">
        <div className="flex items-start gap-3 border-b border-red-200/80 px-6 py-5">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
                <h2 className="text-lg font-semibold text-red-700">{title}</h2>
                <p className="mt-1 text-sm text-red-600/80">{description}</p>
            </div>
        </div>
        <div className="divide-y divide-red-100/70">{children}</div>
    </section>
);

const DangerRow = ({ title, description, control }) => (
    <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h3 className="text-sm font-semibold text-red-700">{title}</h3>
            <p className="mt-1 text-sm text-red-600/80">{description}</p>
        </div>
        <div className="self-end sm:ml-auto sm:self-auto sm:flex-shrink-0">
            {control}
        </div>
    </div>
);

const SelectField = ({
    id,
    value,
    onChange,
    options = [],
    className = "",
    disabled = false,
}) => (
    <div
        className={`relative inline-flex w-full items-center sm:w-auto ${className}`}
    >
        <select
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
            {options.map(({ value: optionValue, label }) => (
                <option key={optionValue} value={optionValue}>
                    {label}
                </option>
            ))}
        </select>
        <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
        />
    </div>
);

const ACCENT_STYLES = {
    danger: {
        panel: "border-red-200/70 bg-white/95 shadow-red-500/25",
        icon: "bg-red-100 text-red-600 shadow-inner shadow-red-200/60",
        info: "bg-red-500/10 text-red-700 ring-red-200/60",
        cancelFocus: "focus:ring-red-100",
        confirm:
            "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 focus:ring-red-300 text-white shadow-red-500/40",
    },
    caution: {
        panel: "border-amber-200/70 bg-white/95 shadow-amber-500/20",
        icon: "bg-amber-100 text-amber-600 shadow-inner shadow-amber-200/60",
        info: "bg-amber-500/10 text-amber-700 ring-amber-200/60",
        cancelFocus: "focus:ring-amber-100",
        confirm:
            "bg-slate-900 hover:bg-slate-950 focus:ring-slate-300 text-white shadow-slate-900/25",
    },
};

let toastId = 0;

const ConfirmationModal = ({
    open,
    onClose,
    onConfirm,
    icon: IconComponent,
    title,
    description,
    bullets = [],
    confirmLabel,
    accent = "danger",
    subtext,
    dialogId,
}) => {
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (open && cancelButtonRef.current) cancelButtonRef.current.focus();
    }, [open]);

    if (!open) return null;

    const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.danger;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogId}
                className={`w-full max-w-xl rounded-3xl border px-6 py-8 text-left shadow-2xl backdrop-blur ${styles.panel}`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}
                    >
                        <IconComponent className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                        <h2
                            id={dialogId}
                            className="text-xl font-semibold text-slate-900"
                        >
                            {title}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            {description}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-auto rounded-full border border-transparent p-1.5 text-slate-400 transition hover:border-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                {(bullets.length > 0 || subtext) && (
                    <div
                        className={`mt-6 rounded-2xl p-4 text-sm ring-1 ${styles.info}`}
                    >
                        {bullets.length > 0 && (
                            <ul className="space-y-2 pl-4 list-disc">
                                {bullets.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {subtext && (
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-current/70">
                                {subtext}
                            </p>
                        )}
                    </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        ref={cancelButtonRef}
                        className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 ${styles.cancelFocus}`}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 ${styles.confirm}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function SettingsView() {
    const { settings, getSettings, updateSettings, resetSettings } =
        useSettings();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showClearVideosModal, setShowClearVideosModal] = useState(false);
    const [draftSettings, setDraftSettings] = useState({ ...settings });
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        void getSettings(() => getUserSettings(auth.currentUser.uid));
    }, [getSettings]);

    useEffect(() => {
        setDraftSettings({ ...settings });
    }, [settings]);

    const persistDraftSettings = useCallback(async () => {
        const changes = {};
        if (draftSettings.safeSearch !== settings.safeSearch)
            changes.safeSearch = draftSettings.safeSearch;
        if (draftSettings.videoDuration !== settings.videoDuration)
            changes.videoDuration = draftSettings.videoDuration;
        if (Object.keys(changes).length === 0) return;
        await updateSettings(
            (next) => updateUserSettings(auth.currentUser.uid, next),
            changes
        );
    }, [draftSettings, settings, updateSettings]);

    useDebounce(persistDraftSettings, [persistDraftSettings], 500);

    const handleSelectChange = (key) => (event) => {
        setDraftSettings((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const resetDisabled = useMemo(
        () =>
            Object.entries(DEFAULT_SETTINGS).every(
                ([k, v]) => draftSettings[k] === v
            ),
        [draftSettings]
    );

    const buttonUnified =
        "inline-flex min-w-[200px] items-center justify-center rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400";

    const handleReset = async () => {
        setDraftSettings({ ...DEFAULT_SETTINGS });
        await resetSettings(() => resetUserSettings(auth.currentUser.uid));
    };

    const handleDeleteAccount = async () => {
        setShowDeleteModal(false);
        await deleteUser(auth.currentUser);
    };

    const handleClearSavedVideos = async () => {
        setShowClearVideosModal(false);
        try {
            const ok = await deleteAllVideos(auth.currentUser.uid);
            if (!ok) throw new Error();
            setToasts((t) => [
                ...t,
                {
                    id: ++toastId,
                    message: "Cleared saved videos",
                    Icon: CircleCheck,
                },
            ]);
        } catch {
            setToasts((t) => [
                ...t,
                {
                    id: ++toastId,
                    message: "Failed to clear saved videos",
                    Icon: CircleX,
                },
            ]);
        }
    };

    return (
        <div className="relative mx-auto max-w-4xl space-y-8">
            {/* Modals */}
            <ConfirmationModal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                icon={AlertTriangle}
                accent="danger"
                dialogId="delete-account-modal"
                title="Permanently delete your account?"
                description="This removes every saved video, playlist, note, and preference associated with this account."
                bullets={[
                    "All saved videos, notes, playlists, and preferences will be removed.",
                    "You can't recover your NoteSync account after deletion.",
                ]}
                subtext="This action cannot be undone."
                confirmLabel="Delete account"
            />
            <ConfirmationModal
                open={showClearVideosModal}
                onClose={() => setShowClearVideosModal(false)}
                onConfirm={handleClearSavedVideos}
                icon={Trash2}
                accent="caution"
                dialogId="clear-videos-modal"
                title="Clear all saved videos?"
                description="This deletes all videos and notes from My Videos but keeps your account active."
                bullets={[
                    "Only NoteSync entries will be removed; your account remains intact.",
                ]}
                subtext="This action cannot be undone."
                confirmLabel="Clear saved videos"
            />

            {/* Header */}
            <header className="rounded-2xl bg-gradient-to-r from-red-500/90 to-rose-500/80 p-6 text-white shadow-sm">
                <h1 className="text-2xl font-semibold">Your Preferences</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80">
                    Fine-tune how NoteSync searches and manages your saved
                    content.
                </p>
            </header>

            {/* Preferences */}
            <SectionCard
                title="Search Preferences"
                description="Set default filters that shape your NoteSync search results."
            >
                <Row
                    title="Safe search level"
                    description="Filter YouTube search results using SafeSearch."
                    control={
                        <SelectField
                            id="preferences-safe-search"
                            value={draftSettings.safeSearch}
                            onChange={handleSelectChange("safeSearch")}
                            options={safeSearchOptions}
                            className="sm:min-w-[17rem]"
                        />
                    }
                />
                <Row
                    title="Preferred video length"
                    description="Limit search results by video duration."
                    control={
                        <SelectField
                            id="preferences-video-duration"
                            value={draftSettings.videoDuration}
                            onChange={handleSelectChange("videoDuration")}
                            options={videoDurationOptions}
                            className="sm:min-w-[17rem]"
                        />
                    }
                />
            </SectionCard>

            {/* Reset Section */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleReset}
                    disabled={resetDisabled}
                    className={buttonUnified}
                >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to defaults
                </button>
            </div>

            {/* Danger Zone */}
            <DangerSection
                title="Danger Zone"
                description="Irreversible actions that affect your NoteSync data."
            >
                <DangerRow
                    title="Delete account"
                    description="Remove all saved videos, notes, and preferences permanently."
                    control={
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className={buttonUnified}
                        >
                            <Settings2 className="mr-2 h-4 w-4" />
                            Delete account
                        </button>
                    }
                />
                <DangerRow
                    title="Clear saved videos"
                    description="Delete all videos from My Videos while keeping your account."
                    control={
                        <button
                            type="button"
                            onClick={() => setShowClearVideosModal(true)}
                            className={buttonUnified}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear saved videos
                        </button>
                    }
                />
            </DangerSection>

            <ToastContainer toasts={toasts} />
        </div>
    );
}
