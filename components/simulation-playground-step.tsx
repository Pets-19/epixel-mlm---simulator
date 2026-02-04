'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Play, Pause, RotateCcw, FastForward, Users, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SimulationPlaygroundStepProps {
    simulationResult: any
    genealogyType: string
}

export default function SimulationPlaygroundStep({ simulationResult, genealogyType }: SimulationPlaygroundStepProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentCycle, setCurrentCycle] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1 = 1s per cycle
    const maxCycles = simulationResult?.number_of_payout_cycles || 1

    // Stats for the current timeframe
    const [currentStats, setCurrentStats] = useState({
        userCount: 0,
        totalVolume: 0,
        newUsers: 0,
        newVolume: 0
    })

    // Timer ref
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (simulationResult) {
            calculateStats(currentCycle)
        }
    }, [currentCycle, simulationResult])

    const calculateStats = (cycle: number) => {
        if (!simulationResult?.users) return

        const usersUpToCycle = simulationResult.users.filter((u: any) => u.payout_cycle <= cycle)
        const usersInCycle = simulationResult.users.filter((u: any) => u.payout_cycle === cycle)

        // Calculate accumulation
        const totalVol = usersUpToCycle.reduce((sum: number, u: any) => sum + (u.personal_volume || 0), 0)
        const newVol = usersInCycle.reduce((sum: number, u: any) => sum + (u.personal_volume || 0), 0)

        setCurrentStats({
            userCount: usersUpToCycle.length,
            totalVolume: totalVol,
            newUsers: usersInCycle.length,
            newVolume: newVol
        })
    }

    const togglePlay = () => {
        if (isPlaying) {
            pause()
        } else {
            play()
        }
    }

    const play = () => {
        setIsPlaying(true)
        if (currentCycle >= maxCycles) {
            setCurrentCycle(0)
        }
    }

    const pause = () => {
        setIsPlaying(false)
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    const reset = () => {
        pause()
        setCurrentCycle(0)
    }

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentCycle(prev => {
                    if (prev >= maxCycles) {
                        pause()
                        return prev
                    }
                    return prev + 1
                })
            }, 1000 / playbackSpeed)
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [isPlaying, maxCycles, playbackSpeed])

    // Process users for the tree visualization
    // We only show the tree structure, but we animate the 'active' state of nodes
    const rootUsers = simulationResult?.users.filter((u: any) => !u.parent_id) || []

    if (!simulationResult) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500">No simulation data available. Please run the simulation first.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Simulation Playground</h2>
                <p className="text-gray-600 mt-2">
                    Visualize growth over time and analyze network dynamics
                </p>
            </div>

            {/* Control Panel */}
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                        {/* Playback Controls */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant={isPlaying ? "destructive" : "default"}
                                size="icon"
                                onClick={togglePlay}
                                className="w-12 h-12 rounded-full shadow-lg"
                            >
                                {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
                            </Button>

                            <Button variant="outline" size="icon" onClick={reset}>
                                <RotateCcw className="w-4 h-4" />
                            </Button>

                            <div className="flex flex-col gap-1 min-w-[120px]">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</span>
                                <div className="text-2xl font-bold text-slate-800 font-mono">
                                    Cycle {currentCycle} <span className="text-sm text-gray-400">/ {maxCycles}</span>
                                </div>
                            </div>
                        </div>

                        {/* Scrubber */}
                        <div className="flex-1 w-full px-4">
                            <Slider
                                value={[currentCycle]}
                                min={0}
                                max={maxCycles}
                                step={1}
                                onValueChange={(val) => {
                                    pause()
                                    setCurrentCycle(val[0])
                                }}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                                <span>Start</span>
                                <span>End</span>
                            </div>
                        </div>

                        {/* Speed Control */}
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                            <span className="text-xs font-semibold text-gray-500">Speed</span>
                            <Button
                                variant={playbackSpeed === 0.5 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setPlaybackSpeed(0.5)}
                                className="h-7 px-2 text-xs"
                            >
                                0.5x
                            </Button>
                            <Button
                                variant={playbackSpeed === 1 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setPlaybackSpeed(1)}
                                className="h-7 px-2 text-xs"
                            >
                                1x
                            </Button>
                            <Button
                                variant={playbackSpeed === 2 ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setPlaybackSpeed(2)}
                                className="h-7 px-2 text-xs"
                            >
                                2x
                            </Button>
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                    key={`stat-users-${currentStats.userCount}`}
                >
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total Users</p>
                                <p className="text-2xl font-bold text-blue-900">{currentStats.userCount.toLocaleString()}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-300" />
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                    key={`stat-vol-${currentStats.totalVolume}`}
                >
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Total Volume</p>
                                <p className="text-2xl font-bold text-green-900">${currentStats.totalVolume.toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-300" />
                        </CardContent>
                    </Card>
                </motion.div>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">New Users (This Cycle)</p>
                            <p className="text-xl font-bold text-gray-900">+{currentStats.newUsers}</p>
                        </div>
                        <Activity className="w-8 h-8 text-gray-200" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">New Volume (This Cycle)</p>
                            <p className="text-xl font-bold text-gray-900">+${currentStats.newVolume.toLocaleString()}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-gray-200" />
                    </CardContent>
                </Card>
            </div>

            {/* Visual Tree */}
            <Card className="overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Network Structure Visualization</CardTitle>
                        <Badge variant="outline">{genealogyType} Structure</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6 bg-slate-50 min-h-[400px] overflow-auto">
                    <div className="min-w-max mx-auto">
                        {rootUsers.map((user: any) => (
                            <AnimatedTreeNode
                                key={user.id}
                                user={user}
                                allUsers={simulationResult.users}
                                currentCycle={currentCycle}
                                genealogyType={genealogyType}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}

function AnimatedTreeNode({ user, allUsers, currentCycle, genealogyType }: any) {
    const isVisible = user.payout_cycle <= currentCycle
    const isNew = user.payout_cycle === currentCycle
    const children = allUsers.filter((u: any) => u.parent_id === user.id)

    // Sort children for binary tree specifically to keep left/right visual consistency
    if (genealogyType === 'binary') {
        children.sort((a: any, b: any) => {
            const posA = a.genealogy_position === 'left' ? 0 : 1
            const posB = b.genealogy_position === 'left' ? 0 : 1
            return posA - posB
        })
    }

    return (
        <div className="flex flex-col items-center">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{
                            opacity: 1,
                            scale: isNew ? 1.1 : 1,
                            y: 0,
                            transition: { type: "spring", stiffness: 300, damping: 20 }
                        }}
                        className={`
              relative z-10 flex flex-col items-center justify-center 
              w-16 h-16 rounded-full border-2 shadow-sm transition-colors duration-300
              ${isNew ? 'bg-yellow-100 border-yellow-400 ring-4 ring-yellow-100/50' : 'bg-white border-blue-200'}
              cursor-help group
            `}
                    >
                        <Users className={`w-6 h-6 ${isNew ? 'text-yellow-600' : 'text-blue-500'}`} />
                        <span className="text-[10px] font-bold text-gray-600 mt-1">L{user.level}</span>

                        {/* Tooltip */}
                        <div className="absolute top-full mt-2 hidden group-hover:block z-50 w-48 bg-gray-900 text-white text-xs rounded p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <p className="font-bold">{user.name}</p>
                            <p>Joined: Cycle {user.payout_cycle}</p>
                            <p>PV: ${user.personal_volume}</p>
                            <p>Team Vol: ${user.team_volume}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isVisible && children.length > 0 && (
                <div className="flex items-start mt-4 gap-4 relative">
                    {/* Connector Lines */}
                    <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-px h-4 bg-gray-300"></div>
                    {/* Horizontal Bar for children */}
                    {children.length > 1 && (
                        <div className="absolute top-[-16px] left-[25%] right-[25%] h-px bg-gray-300"></div>
                    )}

                    {children.map((child: any) => (
                        <div key={child.id} className="relative pt-4">
                            {/* Connector from horizontal bar to child */}
                            <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-px h-4 bg-gray-300"></div>
                            <AnimatedTreeNode
                                user={child}
                                allUsers={allUsers}
                                currentCycle={currentCycle}
                                genealogyType={genealogyType}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
