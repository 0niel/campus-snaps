"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "~/components/Header";
import { PhotoModal } from "~/components/PhotoModal";
import { ImageWithCache } from "~/components/ImageWithCache";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { type Group, type Photo, type User, type FeedItem } from "~/types";

type GroupType = "academic" | "community";

export default function GroupsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'academic' | 'community'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeGroupTab, setActiveGroupTab] = useState<'photos' | 'members' | 'about'>('photos');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const { data: session } = useSession();

  
  const { 
    data: academicGroupsData, 
    isLoading: isLoadingGroups 
  } = api.group.getAll.useQuery({
    search: searchQuery,
    limit: 50
  }, {
    enabled: mounted && (activeTab === 'all' || activeTab === 'academic')
  });

  
  const { 
    data: communityGroupsData, 
    isLoading: isLoadingCommunities 
  } = api.group.getCommunities.useQuery({
    search: searchQuery,
    limit: 50
  }, {
    enabled: mounted && (activeTab === 'all' || activeTab === 'community')
  });

  
  const { 
    data: selectedGroupData, 
    isLoading: isLoadingSelectedGroup 
  } = api.group.getById.useQuery({
    id: selectedGroupId || 0
  }, {
    enabled: mounted && selectedGroupId !== null
  });

  
  const { data: userMembership } = api.user.getById.useQuery(
    { id: session?.user.id || '' },
    { enabled: !!session?.user.id && !!selectedGroupId }
  );

  
  const joinGroupMutation = api.group.join.useMutation({
    onSuccess: () => {
      
      if (selectedGroupId) {
        void refetchSelectedGroup();
      }
    }
  });

  
  const leaveGroupMutation = api.group.leave.useMutation({
    onSuccess: () => {
      
      if (selectedGroupId) {
        void refetchSelectedGroup();
      }
    }
  });

  
  const handleGroupMembership = (groupId: number) => {
    if (!session) {
      setShowAuthDialog(true);
      return;
    }

    const isMember = userMembership?.academicGroupId === groupId;

    if (isMember) {
      leaveGroupMutation.mutate();
    } else {
      joinGroupMutation.mutate({ groupId });
    }
  };

  
  const { refetch: refetchSelectedGroup } = api.group.getById.useQuery({
    id: selectedGroupId || 0
  }, {
    enabled: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  
  const groups = React.useMemo(() => {
    const academicGroups = academicGroupsData?.groups.map(g => ({ ...g, type: 'academic' as GroupType })) || [];
    const communities = communityGroupsData?.communities.map(c => ({ ...c, type: 'community' as GroupType })) || [];

    if (activeTab === 'academic') return academicGroups;
    if (activeTab === 'community') return communities;
    return [...academicGroups, ...communities];
  }, [academicGroupsData, communityGroupsData, activeTab]);

  const isLoading = (activeTab === 'academic' || activeTab === 'all') && isLoadingGroups || 
                   (activeTab === 'community' || activeTab === 'all') && isLoadingCommunities;

  const openPhotoModal = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  
  const createFeedItemFromPhoto = (photo: Photo): FeedItem => {
    return {
      id: photo.id,
      type: 'photo',
      data: photo,
      date: new Date(photo.uploadDate),
    };
  };

  
  const isUserMemberOfSelectedGroup = selectedGroupId && userMembership?.academicGroupId === selectedGroupId;
                   
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header 
        onUploadClick={() => setIsUploadModalOpen(true)} 
        onCalendarToggle={() => setShowCalendar(!showCalendar)}
        showCalendar={showCalendar} 
      />

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Учебные группы и сообщества</h1>
          <p className="text-gray-400 mb-4">Присоединяйтесь к учебным группам и студенческим сообществам, делитесь фотографиями</p>
          
          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative flex-grow max-w-md">
              <input 
                type="search" 
                placeholder="Поиск групп и сообществ..." 
                className="w-full py-2 px-4 pr-10 rounded-lg border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="flex space-x-2 border-b border-gray-700">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Все группы
              </button>
              <button 
                onClick={() => setActiveTab('academic')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'academic' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Учебные группы
              </button>
              <button 
                onClick={() => setActiveTab('community')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'community' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Сообщества
              </button>
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && groups.length === 0 && (
          <div className="text-center py-10 bg-gray-900 rounded-lg shadow-sm">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-800 mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-200 mb-2">По вашему запросу не найдено групп или сообществ</h3>
            <p className="text-gray-400 mb-4">Попробуйте изменить параметры поиска</p>
            {searchQuery && (
              <button 
                className="text-blue-400 hover:text-blue-300 font-medium"
                onClick={() => setSearchQuery('')}
              >
                Сбросить поиск
              </button>
            )}
          </div>
        )}
        
        {/* Group listing */}
        {!isLoading && groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Badge for type */}
                <div className="absolute top-2 left-2 z-10">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${group.type === 'academic' ? 'bg-green-800 text-green-100' : 'bg-purple-800 text-purple-100'}`}>
                    {group.type === 'academic' ? 'Учебная группа' : 'Сообщество'}
                  </span>
                </div>
                
                {/* Cover image */}
                <div className="h-32 relative">
                  <ImageWithCache
                    src={group.coverImage || `/images/group-${group.type === 'academic' ? 'academic' : 'community'}-default.jpg`}
                    alt={group.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                    <h3 className="text-white font-medium p-3 text-lg">{group.name}</h3>
                  </div>
                </div>
                
                {/* Group info */}
                <div className="p-4">
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">{group.description || 'Нет описания'}</p>
                  
                  {/* Tags for communities */}
                  {group.type === 'community' && group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {group.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm mb-4">
                    <span className="flex items-center text-gray-400">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {group._count?.users || 0} участников
                    </span>
                    <span className="flex items-center text-gray-400">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {group.photoCount || 0} фото
                    </span>
                  </div>
                  
                  {/* Recent photos */}
                  <div className="flex space-x-2 mb-4">
                    {(group.recentPhotos && group.recentPhotos.length > 0) ? (
                      group.recentPhotos.slice(0, 3).map((photo: any) => (
                        <div key={photo.id} className="w-16 h-16 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                          <ImageWithCache
                            src={photo.url}
                            alt="Фото группы"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="w-full py-2 text-center text-sm text-gray-400">
                        Нет фотографий
                      </div>
                    )}
                  </div>
                  
                  {/* Member avatars */}
                  {group.members && group.members.length > 0 && (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map((member: any) => (
                          <div key={member.id} className="w-6 h-6 rounded-full overflow-hidden border border-gray-800">
                            <ImageWithCache
                              src={member.image || "/images/default-avatar.png"}
                              alt={member.name || "Участник группы"}
                              width={24}
                              height={24}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {group._count?.users > 3 && (
                        <div className="ml-2 text-xs text-gray-400">
                          и еще {(group._count?.users || 0) - (group.members?.length || 0)} участников
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Button */}
                  <button
                    className="w-full mt-4 py-2 bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 font-medium rounded-md transition-colors"
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    Просмотр группы
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Group detail modal */}
        <AnimatePresence>
        {selectedGroupId !== null && selectedGroupData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" 
            onClick={() => setSelectedGroupId(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
              {isLoadingSelectedGroup ? (
                <div className="h-48 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="h-48 relative">
                    <ImageWithCache
                      src={selectedGroupData.coverImage || `/images/group-${
                        ["Студенческий Медиацентр", "Студенческий союз", "Спортивный клуб", "Научное сообщество"].includes(selectedGroupData.name)
                          ? 'community'
                          : 'academic'
                      }-default.jpg`}
                      alt={selectedGroupData.name}
                      fill
                      className="object-cover"
                    />
                    <button 
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
                      onClick={() => setSelectedGroupId(null)}
                    >
                      ×
                    </button>
                    <div className="absolute top-4 left-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        ["Студенческий Медиацентр", "Студенческий союз", "Спортивный клуб", "Научное сообщество"].includes(selectedGroupData.name) 
                          ? 'bg-purple-800 text-purple-100' 
                          : 'bg-green-800 text-green-100'
                      }`}>
                        {["Студенческий Медиацентр", "Студенческий союз", "Спортивный клуб", "Научное сообщество"].includes(selectedGroupData.name) 
                          ? 'Сообщество' 
                          : 'Учебная группа'
                        }
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <h2 className="text-white text-2xl font-bold">{selectedGroupData.name}</h2>
                    </div>
                  </div>
                  <div className="p-4 overflow-y-auto max-h-[calc(90vh-12rem)]">
                    <p className="text-gray-300 mb-4">{selectedGroupData.description || 'Нет описания'}</p>
                    
                    {/* Tags for communities */}
                    {["Студенческий Медиацентр", "Студенческий союз", "Спортивный клуб", "Научное сообщество"].includes(selectedGroupData.name) && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(selectedGroupData.tags as string[])?.map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between mb-6">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-white">{selectedGroupData._count?.users || 0} участников</p>
                          <p className="text-xs text-gray-400">{selectedGroupData.activeCount || 0} активных на этой неделе</p>
                        </div>
                      </div>
                      
                      {/* Join/Leave Button */}
                      <Button 
                        variant={isUserMemberOfSelectedGroup ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleGroupMembership(selectedGroupData.id)}
                        disabled={joinGroupMutation.isLoading || leaveGroupMutation.isLoading}
                      >
                        {joinGroupMutation.isLoading || leaveGroupMutation.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                        ) : null}
                        {isUserMemberOfSelectedGroup 
                          ? `Покинуть ${["Студенческий Медиацентр", "Студенческий союз", "Спортивный клуб", "Научное сообщество"].includes(selectedGroupData.name) ? 'сообщество' : 'группу'}` 
                          : `Присоединиться к ${["Студенческий Медиацентр", "Студенческий союз", "Спортивный клуб", "Научное сообщество"].includes(selectedGroupData.name) ? 'сообществу' : 'группе'}`
                        }
                      </Button>
                    </div>
                    
                    {/* Tabs */}
                    <div className="border-b border-gray-700 mb-4">
                      <div className="flex space-x-4">
                        <button 
                          className={`px-3 py-2 ${activeGroupTab === 'photos' ? 'border-b-2 border-blue-400 text-blue-400 font-medium' : 'text-gray-400 hover:text-white'}`}
                          onClick={() => setActiveGroupTab('photos')}
                        >
                          Фотографии ({selectedGroupData.photoCount || 0})
                        </button>
                        <button 
                          className={`px-3 py-2 ${activeGroupTab === 'members' ? 'border-b-2 border-blue-400 text-blue-400 font-medium' : 'text-gray-400 hover:text-white'}`}
                          onClick={() => setActiveGroupTab('members')}
                        >
                          Участники ({selectedGroupData._count?.users || 0})
                        </button>
                        <button 
                          className={`px-3 py-2 ${activeGroupTab === 'about' ? 'border-b-2 border-blue-400 text-blue-400 font-medium' : 'text-gray-400 hover:text-white'}`}
                          onClick={() => setActiveGroupTab('about')}
                        >
                          О {["Студенческий Медиацентр", "Студенческий союз", "Спортивный клуб", "Научное сообщество"].includes(selectedGroupData.name) ? 'сообществе' : 'группе'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Tab content */}
                    {activeGroupTab === 'photos' && (
                      <>
                        <h3 className="font-medium mb-3 text-gray-200">Недавние фотографии</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {selectedGroupData.photos && selectedGroupData.photos.length > 0 ? (
                            selectedGroupData.photos.map((photo: Photo) => (
                              <div 
                                key={photo.id} 
                                className="aspect-square bg-gray-800 rounded-md overflow-hidden relative cursor-pointer"
                                onClick={() => openPhotoModal(photo)}
                              >
                                <ImageWithCache
                                  src={photo.url}
                                  alt="Фото группы"
                                  fill
                                  className="object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-3 py-8 text-center text-gray-400">
                              <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-2">В этой группе пока нет фотографий</p>
                              {isUserMemberOfSelectedGroup && (
                                <Button 
                                  className="mt-4"
                                  onClick={() => setIsUploadModalOpen(true)}
                                >
                                  Загрузить первое фото
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {activeGroupTab === 'members' && (
                      <>
                        <h3 className="font-medium mb-3 text-gray-200">Участники группы</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {selectedGroupData.members && selectedGroupData.members.length > 0 ? (
                            selectedGroupData.members.map((member: User) => (
                              <div 
                                key={member.id}
                                className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-gray-800"
                              >
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 mb-2">
                                  <ImageWithCache
                                    src={member.image || "/images/default-avatar.png"}
                                    alt={member.name || "Участник"}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-sm font-medium truncate w-full">{member.name}</p>
                                <p className="text-xs text-gray-400">
                                  {member._count?.photos || 0} фото
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-4 py-8 text-center text-gray-400">
                              <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <p className="mt-2">В этой группе пока нет участников</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {activeGroupTab === 'about' && (
                      <></>
                        <h3 className="font-medium mb-3 text-gray-200">О группе</h3>
                        <p className="text-gray-300">{selectedGroupData.description || 'Нет описания'}</p>
                      </>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}

