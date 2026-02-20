import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Shuffle, Volume2, VolumeX, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

type Algorithm = 'bubble' | 'quick' | 'merge' | 'heap' | 'insertion' | 'selection' | 'shell' | 'counting' | 'radix' | 'bucket' | 'cocktail' | 'comb';
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
  const [customInput, setCustomInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  
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
      audioContextRef.current?.close();
      audioContextRef.current = null;
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

  const applyCustomArray = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed) {
      setInputError('Enter comma-separated numbers (e.g. 50, 120, 30, 200)');
      return;
    }

    const parts = trimmed.split(/[,\s]+/).filter(Boolean);
    const values: number[] = [];

    for (const part of parts) {
      const num = Number(part);
      if (isNaN(num) || !Number.isFinite(num)) {
        setInputError(`"${part}" is not a valid number`);
        return;
      }
      // Clamp to 1-400 range for visual display
      values.push(Math.max(1, Math.min(400, Math.round(num))));
    }

    if (values.length < 2) {
      setInputError('Enter at least 2 numbers');
      return;
    }

    if (values.length > 200) {
      setInputError('Maximum 200 elements allowed');
      return;
    }

    const newArray: ArrayBar[] = values.map(v => ({ value: v, state: 'default' as BarState }));
    setArray(newArray);
    setArraySize(values.length);
    setComparisons(0);
    setSwaps(0);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setInputError(null);
  }, [customInput]);

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

  // Shell Sort
  const shellSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;
    const n = arr.length;

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i++) {
        if (!isPlayingRef.current) return;

        const temp = arr[i];
        let j = i;

        arr[i].state = 'comparing';
        updateArray(arr);
        await sleep(101 - speed);

        while (j >= gap && arr[j - gap].value > temp.value) {
          if (!isPlayingRef.current) return;

          arr[j - gap].state = 'comparing';
          arr[j].state = 'swapping';
          compCount++;
          setComparisons(compCount);
          updateArray(arr);
          playSound(arr[j].value + 200);
          await sleep(101 - speed);

          arr[j] = arr[j - gap];
          swapCount++;
          setSwaps(swapCount);
          j -= gap;
        }

        arr[j] = temp;
        for (let k = 0; k < n; k++) {
          if (arr[k].state !== 'sorted') arr[k].state = 'default';
        }
        updateArray(arr);
      }
    }

    arr.forEach(bar => bar.state = 'sorted');
    updateArray(arr);
  };

  // Cocktail Sort (Bidirectional Bubble Sort)
  const cocktailSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;
    let swapped = true;
    let start = 0;
    let end = arr.length - 1;

    while (swapped) {
      swapped = false;

      // Forward pass
      for (let i = start; i < end; i++) {
        if (!isPlayingRef.current) return;

        arr[i].state = 'comparing';
        arr[i + 1].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[i].value + 200);
        await sleep(101 - speed);

        if (arr[i].value > arr[i + 1].value) {
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
          arr[i].state = 'swapping';
          arr[i + 1].state = 'swapping';
          swapCount++;
          setSwaps(swapCount);
          swapped = true;
          updateArray(arr);
          await sleep(101 - speed);
        }

        arr[i].state = 'default';
        arr[i + 1].state = 'default';
      }

      if (!swapped) break;

      arr[end].state = 'sorted';
      end--;
      swapped = false;

      // Backward pass
      for (let i = end; i > start; i--) {
        if (!isPlayingRef.current) return;

        arr[i].state = 'comparing';
        arr[i - 1].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[i].value + 200);
        await sleep(101 - speed);

        if (arr[i].value < arr[i - 1].value) {
          [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
          arr[i].state = 'swapping';
          arr[i - 1].state = 'swapping';
          swapCount++;
          setSwaps(swapCount);
          swapped = true;
          updateArray(arr);
          await sleep(101 - speed);
        }

        arr[i].state = 'default';
        arr[i - 1].state = 'default';
      }

      arr[start].state = 'sorted';
      start++;
    }

    arr.forEach(bar => bar.state = 'sorted');
    updateArray(arr);
  };

  // Comb Sort
  const combSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;
    const n = arr.length;
    let gap = n;
    const shrink = 1.3;
    let sorted = false;

    while (!sorted) {
      gap = Math.floor(gap / shrink);
      if (gap <= 1) {
        gap = 1;
        sorted = true;
      }

      for (let i = 0; i + gap < n; i++) {
        if (!isPlayingRef.current) return;

        arr[i].state = 'comparing';
        arr[i + gap].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[i].value + 200);
        await sleep(101 - speed);

        if (arr[i].value > arr[i + gap].value) {
          [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
          arr[i].state = 'swapping';
          arr[i + gap].state = 'swapping';
          swapCount++;
          setSwaps(swapCount);
          sorted = false;
          updateArray(arr);
          await sleep(101 - speed);
        }

        arr[i].state = 'default';
        arr[i + gap].state = 'default';
      }
    }

    arr.forEach(bar => bar.state = 'sorted');
    updateArray(arr);
  };

  // Counting Sort
  const countingSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;
    const max = Math.max(...arr.map(b => b.value));
    const min = Math.min(...arr.map(b => b.value));
    const range = max - min + 1;
    const count = new Array(range).fill(0);
    const output: ArrayBar[] = new Array(arr.length);

    // Count occurrences
    for (let i = 0; i < arr.length; i++) {
      if (!isPlayingRef.current) return;

      arr[i].state = 'comparing';
      updateArray(arr);
      compCount++;
      setComparisons(compCount);
      playSound(arr[i].value + 200);
      await sleep(101 - speed);

      count[arr[i].value - min]++;
      arr[i].state = 'default';
    }

    // Cumulative count
    for (let i = 1; i < count.length; i++) {
      count[i] += count[i - 1];
    }

    // Build output array
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!isPlayingRef.current) return;

      arr[i].state = 'swapping';
      updateArray(arr);
      swapCount++;
      setSwaps(swapCount);
      playSound(arr[i].value + 200);
      await sleep(101 - speed);

      output[count[arr[i].value - min] - 1] = { ...arr[i], state: 'default' };
      count[arr[i].value - min]--;
    }

    // Copy back
    for (let i = 0; i < arr.length; i++) {
      if (!isPlayingRef.current) return;

      arr[i] = { ...output[i], state: 'sorted' };
      updateArray(arr);
      await sleep(101 - speed);
    }
  };

  // Radix Sort
  const radixSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;
    const max = Math.max(...arr.map(b => b.value));

    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      if (!isPlayingRef.current) return;

      const output: ArrayBar[] = new Array(arr.length);
      const count = new Array(10).fill(0);

      // Count occurrences
      for (let i = 0; i < arr.length; i++) {
        if (!isPlayingRef.current) return;

        arr[i].state = 'comparing';
        updateArray(arr);
        compCount++;
        setComparisons(compCount);
        playSound(arr[i].value + 200);
        await sleep(101 - speed);

        const digit = Math.floor(arr[i].value / exp) % 10;
        count[digit]++;
        arr[i].state = 'default';
      }

      // Cumulative count
      for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
      }

      // Build output
      for (let i = arr.length - 1; i >= 0; i--) {
        if (!isPlayingRef.current) return;

        arr[i].state = 'swapping';
        updateArray(arr);
        swapCount++;
        setSwaps(swapCount);
        await sleep(101 - speed);

        const digit = Math.floor(arr[i].value / exp) % 10;
        output[count[digit] - 1] = { ...arr[i], state: 'default' };
        count[digit]--;
      }

      // Copy back
      for (let i = 0; i < arr.length; i++) {
        if (!isPlayingRef.current) return;

        arr[i] = output[i];
        updateArray(arr);
        await sleep(101 - speed);
      }
    }

    arr.forEach(bar => bar.state = 'sorted');
    updateArray(arr);
  };

  // Bucket Sort
  const bucketSort = async (arr: ArrayBar[]) => {
    let compCount = 0;
    let swapCount = 0;
    const n = arr.length;
    const bucketCount = 10;
    const max = Math.max(...arr.map(b => b.value));
    const min = Math.min(...arr.map(b => b.value));
    const bucketSize = Math.ceil((max - min + 1) / bucketCount);

    const buckets: ArrayBar[][] = Array.from({ length: bucketCount }, () => []);

    // Distribute into buckets
    for (let i = 0; i < n; i++) {
      if (!isPlayingRef.current) return;

      arr[i].state = 'comparing';
      updateArray(arr);
      compCount++;
      setComparisons(compCount);
      playSound(arr[i].value + 200);
      await sleep(101 - speed);

      const bucketIndex = Math.min(Math.floor((arr[i].value - min) / bucketSize), bucketCount - 1);
      buckets[bucketIndex].push({ ...arr[i], state: 'default' });
      arr[i].state = 'default';
    }

    // Sort each bucket using insertion sort
    for (const bucket of buckets) {
      for (let i = 1; i < bucket.length; i++) {
        if (!isPlayingRef.current) return;

        const key = bucket[i];
        let j = i - 1;

        while (j >= 0 && bucket[j].value > key.value) {
          if (!isPlayingRef.current) return;

          bucket[j + 1] = bucket[j];
          compCount++;
          setComparisons(compCount);
          swapCount++;
          setSwaps(swapCount);
          j--;
        }
        bucket[j + 1] = key;
      }
    }

    // Concatenate buckets
    let index = 0;
    for (const bucket of buckets) {
      for (const item of bucket) {
        if (!isPlayingRef.current) return;

        arr[index] = { ...item, state: 'swapping' };
        updateArray(arr);
        playSound(arr[index].value + 200);
        await sleep(101 - speed);

        arr[index].state = 'sorted';
        index++;
      }
    }

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
        case 'shell':
          await shellSort(arr);
          break;
        case 'cocktail':
          await cocktailSort(arr);
          break;
        case 'comb':
          await combSort(arr);
          break;
        case 'counting':
          await countingSort(arr);
          break;
        case 'radix':
          await radixSort(arr);
          break;
        case 'bucket':
          await bucketSort(arr);
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
    shell: { name: 'Shell Sort', complexity: 'O(n log n)', description: 'Improved insertion sort using gap sequences' },
    cocktail: { name: 'Cocktail Sort', complexity: 'O(n²)', description: 'Bidirectional bubble sort, alternates left-right passes' },
    comb: { name: 'Comb Sort', complexity: 'O(n²/2ᵖ)', description: 'Improved bubble sort using shrinking gap' },
    counting: { name: 'Counting Sort', complexity: 'O(n+k)', description: 'Counts occurrences of each value, non-comparison sort' },
    radix: { name: 'Radix Sort', complexity: 'O(d×n)', description: 'Sorts by processing digits from least to most significant' },
    bucket: { name: 'Bucket Sort', complexity: 'O(n+k)', description: 'Distributes elements into buckets then sorts each bucket' },
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
                <optgroup label="Simple Sorts (O(n²))">
                  <option value="bubble">Bubble Sort</option>
                  <option value="insertion">Insertion Sort</option>
                  <option value="selection">Selection Sort</option>
                  <option value="cocktail">Cocktail Sort</option>
                </optgroup>
                <optgroup label="Efficient Sorts (O(n log n))">
                  <option value="quick">Quick Sort</option>
                  <option value="merge">Merge Sort</option>
                  <option value="heap">Heap Sort</option>
                  <option value="shell">Shell Sort</option>
                </optgroup>
                <optgroup label="Improved Bubble Sorts">
                  <option value="comb">Comb Sort</option>
                </optgroup>
                <optgroup label="Non-Comparison Sorts">
                  <option value="counting">Counting Sort</option>
                  <option value="radix">Radix Sort</option>
                  <option value="bucket">Bucket Sort</option>
                </optgroup>
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

          <div className="flex gap-2 mt-3 items-start">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  value={customInput}
                  onChange={(e) => { setCustomInput(e.target.value); if (inputError) setInputError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyCustomArray(); }}
                  placeholder="Custom array: 50, 120, 30, 200, 90, 150..."
                  disabled={isPlaying}
                  className="flex-1 h-9 text-sm"
                />
                <Button onClick={applyCustomArray} variant="outline" disabled={isPlaying}>
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Apply
                </Button>
              </div>
              {inputError && (
                <p className="text-xs text-red-500 mt-1">{inputError}</p>
              )}
            </div>
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
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {algorithm === 'bubble' && 'Best for: Educational purposes, small datasets'}
                {algorithm === 'quick' && 'Best for: General purpose, average case performance'}
                {algorithm === 'merge' && 'Best for: Stable sort, linked lists, large datasets'}
                {algorithm === 'heap' && 'Best for: Memory constrained, guaranteed O(n log n)'}
                {algorithm === 'insertion' && 'Best for: Small or nearly sorted datasets'}
                {algorithm === 'selection' && 'Best for: Minimizing swaps, small datasets'}
                {algorithm === 'shell' && 'Best for: Medium-sized datasets, better than insertion'}
                {algorithm === 'cocktail' && 'Best for: Datasets with turtles (small values at end)'}
                {algorithm === 'comb' && 'Best for: Better than bubble, simple implementation'}
                {algorithm === 'counting' && 'Best for: Small range of integers, very fast'}
                {algorithm === 'radix' && 'Best for: Integers, fixed-length strings'}
                {algorithm === 'bucket' && 'Best for: Uniformly distributed data'}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-2 dark:text-white">Statistics</h3>
            <p className="text-sm dark:text-white">Comparisons: <span className="font-mono">{comparisons}</span></p>
            <p className="text-sm dark:text-white">Swaps: <span className="font-mono">{swaps}</span></p>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {['counting', 'radix', 'bucket'].includes(algorithm) 
                  ? 'Non-comparison sort - counts may not reflect traditional comparisons'
                  : 'Lower numbers indicate better performance'}
              </p>
            </div>
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

        {/* Algorithm Comparison Table */}
        <Card className="p-4">
          <h3 className="font-bold mb-3 dark:text-white">Algorithm Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-2 dark:text-white">Algorithm</th>
                  <th className="text-left py-2 px-2 dark:text-white">Best</th>
                  <th className="text-left py-2 px-2 dark:text-white">Average</th>
                  <th className="text-left py-2 px-2 dark:text-white">Worst</th>
                  <th className="text-left py-2 px-2 dark:text-white">Space</th>
                  <th className="text-left py-2 px-2 dark:text-white">Stable</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'bubble' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Bubble Sort</td>
                  <td className="py-2 px-2">O(n)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(1)</td>
                  <td className="py-2 px-2">✓</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'insertion' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Insertion Sort</td>
                  <td className="py-2 px-2">O(n)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(1)</td>
                  <td className="py-2 px-2">✓</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'selection' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Selection Sort</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(1)</td>
                  <td className="py-2 px-2">✗</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'quick' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Quick Sort</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(log n)</td>
                  <td className="py-2 px-2">✗</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'merge' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Merge Sort</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n)</td>
                  <td className="py-2 px-2">✓</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'heap' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Heap Sort</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(1)</td>
                  <td className="py-2 px-2">✗</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'shell' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Shell Sort</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n^1.5)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(1)</td>
                  <td className="py-2 px-2">✗</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'cocktail' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Cocktail Sort</td>
                  <td className="py-2 px-2">O(n)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(1)</td>
                  <td className="py-2 px-2">✓</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'comb' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Comb Sort</td>
                  <td className="py-2 px-2">O(n log n)</td>
                  <td className="py-2 px-2">O(n²/2ᵖ)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(1)</td>
                  <td className="py-2 px-2">✗</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'counting' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Counting Sort</td>
                  <td className="py-2 px-2">O(n+k)</td>
                  <td className="py-2 px-2">O(n+k)</td>
                  <td className="py-2 px-2">O(n+k)</td>
                  <td className="py-2 px-2">O(k)</td>
                  <td className="py-2 px-2">✓</td>
                </tr>
                <tr className={`border-b dark:border-gray-700 ${algorithm === 'radix' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Radix Sort</td>
                  <td className="py-2 px-2">O(d×n)</td>
                  <td className="py-2 px-2">O(d×n)</td>
                  <td className="py-2 px-2">O(d×n)</td>
                  <td className="py-2 px-2">O(n+k)</td>
                  <td className="py-2 px-2">✓</td>
                </tr>
                <tr className={`${algorithm === 'bucket' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="py-2 px-2 font-medium dark:text-white">Bucket Sort</td>
                  <td className="py-2 px-2">O(n+k)</td>
                  <td className="py-2 px-2">O(n+k)</td>
                  <td className="py-2 px-2">O(n²)</td>
                  <td className="py-2 px-2">O(n×k)</td>
                  <td className="py-2 px-2">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            n = number of elements, k = range of input, d = number of digits. Stable = maintains relative order of equal elements.
          </p>
        </Card>
      </div>
    </div>
  );
};
