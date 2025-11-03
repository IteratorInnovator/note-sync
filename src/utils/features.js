import { Search, Video, FileText, List, Settings, Download } from "lucide-react";

import searchVideosGif from "../assets/gifs/search-videos.gif";
import manageVideosGif from "../assets/gifs/manage-videos.gif";
// import takeNotesGif from "../assets/gifs/take-notes.gif";
// import organizePlaylistsGif from "../assets/gifs/organize-playlists.gif";
// import settingsGif from "../assets/gifs/settings.gif";
// import exportNotesGif from "../assets/gif/export-notes.gif";

export const features = [
    {
        id: 1,
        icon: Search,
        title: "Search Videos",
        description: "Find and add YouTube videos to your library",
        steps: [
            "Click on 'Search Videos' in the sidebar",
            "Enter your search query or paste a YouTube URL",
            "Browse through the results",
            "Use the add icon to save videos to your library"
        ],
        gifUrl: searchVideosGif
    },
    {
        id: 2,
        icon: Video,
        title: "Manage Videos",
        description: "Add and remove videos from your collection",
        steps: [
            "Go to 'My Videos' to view all saved videos",
            "Click on any video to watch and take notes",
            "Use the delete icon to remove videos you no longer need",
            "Use the filter and search function to find specific videos"
        ],
        gifUrl: manageVideosGif
    },
    {
        id: 3,
        icon: FileText,
        title: "Take Notes",
        description: "Create timestamped notes while watching",
        steps: [
            "Open any video from your library",
            "Watch your video in fullscreen",
            "Click on the pencil icon to add notes while watching",
            "Your note will be timestamped automatically",
            "View that part of the video again by clicking on the note timestamp",
            "Edit or delete notes anytime by clicking on them"
        ],
        
    },
    {
        id: 4,
        icon: List,
        title: "Organize Playlists",
        description: "Create and manage custom playlists",
        steps: [
            "Navigate to 'My Playlists' in the sidebar",
            "Click 'Create Playlist' to start a new collection",
            "Enter the name of the playlist",
            "Select and add the videos you want to your playlists",
            "Rename or delete playlists as needed"
        ],
        
    },
    {
        id: 5,
        icon: Settings,
        title: "Settings",
        description: "Customize and reset your preferences",
        steps: [
            "Click 'Settings' in the sidebar",
            "Adjust your video preferences and display options",
            "Enable or disable safe search filters",
            "Use 'Reset' to restore default settings"
        ],
        
    },
    {
        id: 6,
        icon: Download,
        title: "Export Notes",
        description: "Download your notes as PDF",
        steps: [
            "Select the video with notes you want to export",
            "Click the 'Download Notes' button",
            "Download the generated PDF file"
        ],
        
    }
];
