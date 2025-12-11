import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Shuffle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

type Algorithm = 'bubble' | 'quick' | 'merge' | 'heap' | 'insertion' | 'selection';
type BarState = 'default' | 'comparing' | 'swapping' | 'sorted';

interface ArrayBar {
  value: number;
  state: BarState;
}

export const SortingVisualizer: React.FC = () => {
  const [array, setArray] = useState<ArrayBar[]>([]);
  const [algorithm, setAlgorithm] = useState<Algorithm>('bubble');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [arraySize, setArraySize] = useState(50);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const arrayRef = useRef<ArrayBar[]>([]);

  useEffect(() => {
    generateArray();
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      isPlayingRef.current = false;
    };
  }, []);

  useEffect(() => {
    generateArray();
  }, [arraySize]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    arrayRef.current = array;
  }, [array]);

  const generateArray = useCallback(() => {
    const newArray: ArrayBar[] = [];
    for (let i = 0; i < arraySize; i++) {
      newArray.push({
        value: Math.floor(Math.random() * 400) + 10,
        state: 'default'
      });
    }
    setArray(newArray);
    setComparisons(0);
    setSwaps(0);
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [arraySize]);

  const playSound = useCallback((frequency: number) => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    } catch (error) {
      console.error('Audio error:', error);
    }
  }, [soundEnabled]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateArray = useCallback((newArray: ArrayBar[]) => {
    setArray([...newArray]);
  }, []);

  // Bubble Sort
  const bubbleSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;

    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (!isPlayingRef.current) return;

        arr[j].state = 'comparing';
        arr[j + 1].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[j].value + 200);
        await sleep(101 - speed);

        if (arr[j].value > arr[j + 1].value) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          arr[j].state = 'swapping';
          arr[j + 1].state = 'swapping';
          swapCount++;
          setSwaps(swapCount);
          updateArray(arr);
          await sleep(101 - speed);
        }

        arr[j].state = 'default';
        arr[j + 1].state = 'default';
      }
      arr[arr.length - i - 1].state = 'sorted';
    }
    arr[0].state = 'sorted';
    updateArray(arr);
  };

  // Insertion Sort
  const insertionSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;

    for (let i = 1; i < arr.length; i++) {
      if (!isPlayingRef.current) return;

      const key = arr[i];
      let j = i - 1;

      arr[i].state = 'comparing';
      updateArray(arr);
      await sleep(101 - speed);

      while (j >= 0 && arr[j].value > key.value) {
        if (!isPlayingRef.current) return;

        arr[j].state = 'comparing';
        arr[j + 1].state = 'swapping';
        compCount++;
        setComparisons(compCount);
        updateArray(arr);
        playSound(arr[j].value + 200);
        await sleep(101 - speed);

        arr[j + 1] = arr[j];
        swapCount++;
        setSwaps(swapCount);
        j--;
      }

      arr[j + 1] = key;
      for (let k = 0; k <= i; k++) {
        arr[k].state = 'default';
      }
      updateArray(arr);
    }

    arr.forEach(bar => bar.state = 'sorted');
    updateArray(arr);
  };

  // Selection Sort
  const selectionSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;

    for (let i = 0; i < arr.length - 1; i++) {
      if (!isPlayingRef.current) return;

      let minIdx = i;
      arr[minIdx].state = 'comparing';

      for (let j = i + 1; j < arr.length; j++) {
        if (!isPlayingRef.current) return;

        arr[j].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[j].value + 200);
        await sleep(101 - speed);

        if (arr[j].value < arr[minIdx].value) {
          arr[minIdx].state = 'default';
          minIdx = j;
          arr[minIdx].state = 'comparing';
        } else {
          arr[j].state = 'default';
        }
      }

      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        arr[i].state = 'swapping';
        arr[minIdx].state = 'swapping';
        swapCount++;
        setSwaps(swapCount);
        updateArray(arr);
        await sleep(101 - speed);
      }

      arr[i].state = 'sorted';
      arr[minIdx].state = 'default';
      updateArray(arr);
    }

    arr[arr.length - 1].state = 'sorted';
    updateArray(arr);
  };

  // Quick Sort
  const quickSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;

    const partition = async (low: number, high: number): Promise<number> => {
      const pivot = arr[high].value;
      arr[high].state = 'comparing';
      let i = low - 1;

      for (let j = low; j < high; j++) {
        if (!isPlayingRef.current) return -1;

        arr[j].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[j].value + 200);
        await sleep(101 - speed);

        if (arr[j].value < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          arr[i].state = 'swapping';
          arr[j].state = 'swapping';
          swapCount++;
          setSwaps(swapCount);
          updateArray(arr);
          await sleep(101 - speed);
        }

        arr[j].state = 'default';
      }

      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      arr[i + 1].state = 'sorted';
      arr[high].state = 'default';
      updateArray(arr);
      return i + 1;
    };

    const quickSortHelper = async (low: number, high: number) => {
      if (low < high && isPlayingRef.current) {
        const pi = await partition(low, high);
        if (pi === -1) return;
        await quickSortHelper(low, pi - 1);
        await quickSortHelper(pi + 1, high);
      }
    };

    await quickSortHelper(0, arr.length - 1);
    arr.forEach(bar => bar.state = 'sorted');
    updateArray(arr);
  };

  // Merge Sort
  const mergeSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;

    const merge = async (left: number, mid: number, right: number) => {
      const leftArr = arr.slice(left, mid + 1);
      const rightArr = arr.slice(mid + 1, right + 1);
      
      let i = 0, j = 0, k = left;

      while (i < leftArr.length && j < rightArr.length) {
        if (!isPlayingRef.current) return;

        arr[k].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[k].value + 200);
        await sleep(101 - speed);

        if (leftArr[i].value <= rightArr[j].value) {
          arr[k] = { ...leftArr[i], state: 'swapping' };
          i++;
        } else {
          arr[k] = { ...rightArr[j], state: 'swapping' };
          j++;
        }
        swapCount++;
        setSwaps(swapCount);
        updateArray(arr);
        await sleep(101 - speed);
        arr[k].state = 'default';
        k++;
      }

      while (i < leftArr.length) {
        if (!isPlayingRef.current) return;
        arr[k] = { ...leftArr[i], state: 'swapping' };
        updateArray(arr);
        await sleep(101 - speed);
        arr[k].state = 'default';
        i++;
        k++;
      }

      while (j < rightArr.length) {
        if (!isPlayingRef.current) return;
        arr[k] = { ...rightArr[j], state: 'swapping' };
        updateArray(arr);
        await sleep(101 - speed);
        arr[k].state = 'default';
        j++;
        k++;
      }
    };

    const mergeSortHelper = async (left: number, right: number) => {
      if (left < right && isPlayingRef.current) {
        const mid = Math.floor((left + right) / 2);
        await mergeSortHelper(left, mid);
        await mergeSortHelper(mid + 1, right);
        await merge(left, mid, right);
      }
    };

    await mergeSortHelper(0, arr.length - 1);
    arr.forEach(bar => bar.state = 'sorted');
    updateArray(arr);
  };

  // Heap Sort
  const heapSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;

    const heapify = async (n: number, i: number) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n) {
        arr[left].state = 'comparing';
        arr[largest].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[left].value + 200);
        await sleep(101 - speed);

        if (arr[left].value > arr[largest].value) {
          largest = left;
        }
        arr[left].state = 'default';
        arr[i].state = 'default';
      }

      if (right < n) {
        arr[right].state = 'comparing';
        arr[largest].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[right].value + 200);
        await sleep(101 - speed);

        if (arr[right].value > arr[largest].value) {
          largest = right;
        }
        arr[right].state = 'default';
        arr[largest].state = 'default';
      }

      if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        arr[i].state = 'swapping';
        arr[largest].state = 'swapping';
        swapCount++;
        setSwaps(swapCount);
        updateArray(arr);
        await sleep(101 - speed);
        arr[i].state = 'default';
        arr[largest].state = 'default';
        await heapify(n, largest);
      }
    };

    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
      if (!isPlayingRef.current) return;
      await heapify(arr.length, i);
    }

    for (let i = arr.length - 1; i > 0; i--) {
      if (!isPlayingRef.current) return;

      [arr[0], arr[i]] = [arr[i], arr[0]];
      arr[0].state = 'swapping';
      arr[i].state = 'swapping';
      swapCount++;
      setSwaps(swapCount);
      updateArray(arr);
      await sleep(101 - speed);
      
      arr[i].state = 'sorted';
      arr[0].state = 'default';
      await heapify(i, 0);
    }

    arr[0].state = 'sorted';
    updateArray(arr);
  };

  const startSorting = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    setIsPlaying(true);
    isPlayingRef.current = true;
    setComparisons(0);
    setSwaps(0);

    const arr = array.map(bar => ({ ...bar, state: 'default' as BarState }));

    try {
      switch (algorithm) {
        case 'bubble':
          await bubbleSort(arr);
          break;
        case 'insertion':
          await insertionSort(arr);
          break;
        case 'selection':
          await selectionSort(arr);
          break;
        case 'quick':
          await quickSort(arr);
          break;
        case 'merge':
          await mergeSort(arr);
          break;
        case 'heap':
          await heapSort(arr);
          break;
      }
    } catch (error) {
      console.error('Sorting error:', error);
    } finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  const getBarColor = (state: BarState) => {
    switch (state) {
      case 'comparing': return '#FFD93D';
      case 'swapping': return '#FF6B6B';
      case 'sorted': return '#4ECDC4';
      default: return '#95E1D3';
    }
  };

  const algorithmInfo = {
    bubble: { name: 'Bubble Sort', complexity: 'O(n²)', description: 'Repeatedly swaps adjacent elements if they are in wrong order' },
    quick: { name: 'Quick Sort', complexity: 'O(n log n)', description: 'Divides array using pivot and recursively sorts partitions' },
    merge: { name: 'Merge Sort', complexity: 'O(n log n)', description: 'Divides array into halves and merges them in sorted order' },
    insertion: { name: 'Insertion Sort', complexity: 'O(n²)', description: 'Builds sorted array one item at a time' },
    selection: { name: 'Selection Sort', complexity: 'O(n²)', description: 'Finds minimum element and places it at beginning' },
    heap: { name: 'Heap Sort', complexity: 'O(n log n)', description: 'Uses binary heap data structure to sort' },
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="space-y-4">
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-white">Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => !isPlaying && setAlgorithm(e.target.value as Algorithm)}
                disabled={isPlaying}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="bubble">Bubble Sort</option>
                <option value="quick">Quick Sort</option>
                <option value="merge">Merge Sort</option>
                <option value="heap">Heap Sort</option>
                <option value="insertion">Insertion Sort</option>
                <option value="selection">Selection Sort</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block dark:text-white">Speed: {speed}</label>
              <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={1} max={100} step={1} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block dark:text-white">Array Size: {arraySize}</label>
              <Slider value={[arraySize]} onValueChange={(v) => !isPlaying && setArraySize(v[0])} min={10} max={100} step={5} disabled={isPlaying} />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={startSorting} className="flex-1">
                {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Sort'}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateArray} variant="outline" disabled={isPlaying}>
              <Shuffle className="mr-2 h-4 w-4" />
              New Array
            </Button>
            <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="outline">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-end justify-center gap-1 h-96">
            {array.map((bar, idx) => (
              <div
                key={idx}
                style={{
                  height: `${bar.value}px`,
                  width: `${Math.max(2, 800 / arraySize)}px`,
                  backgroundColor: getBarColor(bar.state),
                  transition: 'all 0.1s ease'
                }}
                className="rounded-t"
              />
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-bold mb-2 dark:text-white">{algorithmInfo[algorithm].name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{algorithmInfo[algorithm].description}</p>
            <p className="text-sm font-mono dark:text-white">Time: {algorithmInfo[algorithm].complexity}</p>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-2 dark:text-white">Statistics</h3>
            <p className="text-sm dark:text-white">Comparisons: <span className="font-mono">{comparisons}</span></p>
            <p className="text-sm dark:text-white">Swaps: <span className="font-mono">{swaps}</span></p>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-2 dark:text-white">Legend</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#95E1D3' }} />
                <span className="dark:text-white">Unsorted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFD93D' }} />
                <span className="dark:text-white">Comparing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF6B6B' }} />
                <span className="dark:text-white">Swapping</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4ECDC4' }} />
                <span className="dark:text-white">Sorted</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
