import React, { useState } from 'react';
import { MessageSquareText, Heart, Plus, Send, X } from 'lucide-react';
import type { ForumPost, UserProfile } from '../types';
import { MorphicCard } from './MorphicCard';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface CommunityViewProps {
  profile: UserProfile;
  daysSmokeFree: number;
  posts: ForumPost[];
  onAddPost: (post: ForumPost) => void;
  onToggleLike: (postId: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  profile,
  daysSmokeFree,
  posts,
  onAddPost,
  onToggleLike,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newTag, setNewTag] = useState<ForumPost['tag']>('Milestone');

  const tags = ['All', 'Milestone', 'SOS Help', 'Advice', 'Wins', 'General'];

  const filteredPosts = selectedTag === 'All'
    ? posts
    : posts.filter(p => p.tag === selectedTag);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const post: ForumPost = {
      id: 'post-' + Date.now(),
      authorName: profile.name || 'Anonymous Champion',
      authorAvatar: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      smokeFreeDays: daysSmokeFree,
      timestamp: 'Just now',
      tag: newTag,
      title: newTitle.trim(),
      content: newContent.trim(),
      likes: 1,
      userLiked: true,
      commentsCount: 0,
    };

    onAddPost(post);
    sound.playCelebration();
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch {
      // Confetti fallback
    }

    setNewTitle('');
    setNewContent('');
    setIsPostModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* 1. Community Hero Banner */}
      <MorphicCard variant="emerald" className="relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">The Smoke-Free Tribe</h3>
              <p className="text-[11px] text-emerald-300/80">Never fight a craving in isolation</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setIsPostModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/35 text-xs font-semibold shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Share Story</span>
          </button>
        </div>
      </MorphicCard>

      {/* 2. Tag Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              sound.playClick();
              setSelectedTag(tag);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
              selectedTag === tag
                ? 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200 shadow-sm'
                : 'glass-panel border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 3. Forum Posts Feed */}
      <div className="space-y-3">
        {filteredPosts.map((post) => (
          <MorphicCard key={post.id} variant="default" className="border-white/10 space-y-3">
            {/* Author bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-9 h-9 rounded-xl object-cover border border-white/15"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{post.authorName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Day {post.smokeFreeDays}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{post.timestamp}</span>
                </div>
              </div>

              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                post.tag === 'SOS Help'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : post.tag === 'Wins'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-white/5'
              }`}>
                {post.tag}
              </span>
            </div>

            {/* Post Title & Content */}
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">{post.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleLike(post.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                  post.userLiked
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'glass-button text-slate-400 hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${post.userLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span>{post.likes} Support</span>
              </button>

              <span className="text-[11px] text-slate-400">
                {post.commentsCount} comments
              </span>
            </div>
          </MorphicCard>
        ))}
      </div>

      {/* Create Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel-elevated p-6 border border-white/15 shadow-2xl">
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Create Community Post</h3>
            <p className="text-xs text-slate-400 mb-4">
              Share a victory, ask for advice, or request support during a craving.
            </p>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Milestone', 'SOS Help', 'Advice', 'Wins', 'General'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTag(t)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                        newTag === t
                          ? 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Day 5: Made it through my first weekend smoke-free!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Story</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="What worked for you? How did you disarm the craving? Share with fellow quitters..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish to Community</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
