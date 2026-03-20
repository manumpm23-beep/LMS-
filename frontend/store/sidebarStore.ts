import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';

interface VideoNode {
  id: string;
  title: string;
  orderIndex: number;
  isCompleted: boolean;
  locked: boolean;
}

interface SectionNode {
  id: string;
  title: string;
  orderIndex: number;
  videos: VideoNode[];
}

interface SubjectTree {
  id: string;
  title: string;
  sections: SectionNode[];
}

interface SidebarState {
  tree: SubjectTree | null;
  loading: boolean;
  error: string | null;
  fetchTree: (subjectId: string) => Promise<void>;
  markVideoCompleted: (videoId: string) => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  tree: null,
  loading: true,
  error: null,

  fetchTree: async (subjectId) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get(`/api/subjects/${subjectId}/tree`);
      set({ tree: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch syllabus tree', loading: false });
    }
  },

  markVideoCompleted: (videoId) => {
    const { tree } = get();
    if (!tree) return;

    // Fast nested clone for Zustand replacement targeting state updates
    const newTree = { ...tree };
    newTree.sections = tree.sections.map(sec => ({
      ...sec,
      videos: sec.videos.map(v =>
        v.id === videoId ? { ...v, isCompleted: true } : v
      )
    }));

    // Re-evaluate lock conditions sequentially across globally flattened indices mimicking backend architecture
    const flatVideos = newTree.sections.flatMap(s => s.videos);
    for (let i = 0; i < flatVideos.length; i++) {
      if (i === 0) flatVideos[i].locked = false;
      else flatVideos[i].locked = !flatVideos[i - 1].isCompleted;
    }

    set({ tree: newTree });
  }
}));