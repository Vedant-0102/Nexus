import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Square, Circle, Triangle, Box, Cylinder, Cone, Ruler } from 'lucide-react';

export const GeometryCalculator: React.FC = () => {
  // 2D Shapes State
  const [squareSide, setSquareSide] = useState<number>(5);
  const [rectangleLength, setRectangleLength] = useState<number>(8);
  const [rectangleWidth, setRectangleWidth] = useState<number>(5);
  const [circleRadius, setCircleRadius] = useState<number>(4);
  const [triangleSideA, setTriangleSideA] = useState<number>(3);
  const [triangleSideB, setTriangleSideB] = useState<number>(4);
  const [triangleSideC, setTriangleSideC] = useState<number>(5);
  const [trapezoidBase1, setTrapezoidBase1] = useState<number>(5);
  const [trapezoidBase2, setTrapezoidBase2] = useState<number>(8);
  const [trapezoidHeight, setTrapezoidHeight] = useState<number>(4);

  // 3D Shapes State
  const [cubeSide, setCubeSide] = useState<number>(5);
  const [cubeLength, setCubeLength] = useState<number>(8);
  const [cubeWidth, setCubeWidth] = useState<number>(5);
  const [cubeHeight, setCubeHeight] = useState<number>(6);
  const [sphereRadius, setSphereRadius] = useState<number>(4);
  const [cylinderRadius, setCylinderRadius] = useState<number>(3);
  const [cylinderHeight, setCylinderHeight] = useState<number>(7);
  const [coneRadius, setConeRadius] = useState<number>(3);
  const [coneHeight, setConeHeight] = useState<number>(8);

  // Angle State
  const [angle1, setAngle1] = useState<number>(45);
  const [angle2, setAngle2] = useState<number>(60);

  const PI = Math.PI;

  // 2D Calculations
  const squareArea = squareSide * squareSide;
  const squarePerimeter = 4 * squareSide;

  const rectangleArea = rectangleLength * rectangleWidth;
  const rectanglePerimeter = 2 * (rectangleLength + rectangleWidth);

  const circleArea = PI * circleRadius * circleRadius;
  const circleCircumference = 2 * PI * circleRadius;

  // Triangle (Heron's formula for area from 3 sides)
  const trianglePerimeter = triangleSideA + triangleSideB + triangleSideC;
  const triangleS = trianglePerimeter / 2;
  const triangleValid = triangleSideA > 0 && triangleSideB > 0 && triangleSideC > 0 &&
    triangleSideA + triangleSideB > triangleSideC &&
    triangleSideA + triangleSideC > triangleSideB &&
    triangleSideB + triangleSideC > triangleSideA;
  const triangleAreaVal = triangleValid
    ? Math.sqrt(triangleS * (triangleS - triangleSideA) * (triangleS - triangleSideB) * (triangleS - triangleSideC))
    : 0;

  const trapezoidArea = 0.5 * (trapezoidBase1 + trapezoidBase2) * trapezoidHeight;

  // 3D Calculations
  const cubeVolume = Math.pow(cubeSide, 3);
  const cubeSurfaceArea = 6 * Math.pow(cubeSide, 2);

  const cuboidVolume = cubeLength * cubeWidth * cubeHeight;
  const cuboidSurfaceArea = 2 * (cubeLength * cubeWidth + cubeWidth * cubeHeight + cubeHeight * cubeLength);

  const sphereVolume = (4 / 3) * PI * Math.pow(sphereRadius, 3);
  const sphereSurfaceArea = 4 * PI * Math.pow(sphereRadius, 2);

  const cylinderVolume = PI * Math.pow(cylinderRadius, 2) * cylinderHeight;
  const cylinderSurfaceArea = 2 * PI * cylinderRadius * (cylinderRadius + cylinderHeight);

  const coneVolume = (1 / 3) * PI * Math.pow(coneRadius, 2) * coneHeight;
  const coneSurfaceArea = PI * coneRadius * (coneRadius + Math.sqrt(Math.pow(coneHeight, 2) + Math.pow(coneRadius, 2)));

  // Angle Calculations
  const degreesToRadians = (degrees: number) => degrees * (PI / 180);
  const radiansToDegrees = (radians: number) => radians * (180 / PI);
  const complementaryAngle = 90 - angle1;
  const supplementaryAngle = 180 - angle1;
  const angleSum = angle1 + angle2;
  const thirdAngle = 180 - angleSum;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Geometry Calculator</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Calculate area, volume, and angles for shapes</p>
      </div>

      <Tabs defaultValue="2d" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="2d">
            <Square className="h-4 w-4 mr-2" />
            2D Shapes
          </TabsTrigger>
          <TabsTrigger value="3d">
            <Box className="h-4 w-4 mr-2" />
            3D Shapes
          </TabsTrigger>
          <TabsTrigger value="angles">
            <Triangle className="h-4 w-4 mr-2" />
            Angles
          </TabsTrigger>
        </TabsList>

        {/* 2D Shapes */}
        <TabsContent value="2d" className="mt-4 space-y-4">
          {/* Square */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Square className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-bold dark:text-white">Square</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Side Length</Label>
                <Input
                  type="number"
                  value={squareSide}
                  onChange={(e) => setSquareSide(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Area</p>
                  <p className="text-lg font-bold dark:text-white">{squareArea.toFixed(2)} units²</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Perimeter</p>
                  <p className="text-lg font-bold dark:text-white">{squarePerimeter.toFixed(2)} units</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Rectangle */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Square className="h-5 w-5 text-green-600" />
              <h3 className="text-xl font-bold dark:text-white">Rectangle</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Length</Label>
                  <Input
                    type="number"
                    value={rectangleLength}
                    onChange={(e) => setRectangleLength(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    value={rectangleWidth}
                    onChange={(e) => setRectangleWidth(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Area</p>
                  <p className="text-lg font-bold dark:text-white">{rectangleArea.toFixed(2)} units²</p>
                </div>
                <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Perimeter</p>
                  <p className="text-lg font-bold dark:text-white">{rectanglePerimeter.toFixed(2)} units</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Circle */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Circle className="h-5 w-5 text-orange-600" />
              <h3 className="text-xl font-bold dark:text-white">Circle</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Radius</Label>
                <Input
                  type="number"
                  value={circleRadius}
                  onChange={(e) => setCircleRadius(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Area</p>
                  <p className="text-lg font-bold dark:text-white">{circleArea.toFixed(2)} units²</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Circumference</p>
                  <p className="text-lg font-bold dark:text-white">{circleCircumference.toFixed(2)} units</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Triangle */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Triangle className="h-5 w-5 text-pink-600" />
              <h3 className="text-xl font-bold dark:text-white">Triangle</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Heron's formula)</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Side A</Label>
                  <Input
                    type="number"
                    min="0.01"
                    value={triangleSideA}
                    onChange={(e) => setTriangleSideA(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Side B</Label>
                  <Input
                    type="number"
                    min="0.01"
                    value={triangleSideB}
                    onChange={(e) => setTriangleSideB(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Side C</Label>
                  <Input
                    type="number"
                    min="0.01"
                    value={triangleSideC}
                    onChange={(e) => setTriangleSideC(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {!triangleValid && (triangleSideA > 0 || triangleSideB > 0 || triangleSideC > 0) && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                    <p className="text-sm text-red-600 dark:text-red-400">Invalid triangle: the sum of any two sides must exceed the third.</p>
                  </div>
                )}
                <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Area (Heron's)</p>
                  <p className="text-lg font-bold dark:text-white">{triangleValid ? triangleAreaVal.toFixed(2) : '—'} units²</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Perimeter</p>
                  <p className="text-lg font-bold dark:text-white">{triangleValid ? trianglePerimeter.toFixed(2) : '—'} units</p>
                </div>
                {triangleValid && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-gray-600 dark:text-gray-400">
                    <p>s = P/2 = {triangleS.toFixed(2)}</p>
                    <p>A = sqrt(s(s-a)(s-b)(s-c))</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 3D Shapes */}
        <TabsContent value="3d" className="mt-4 space-y-4">
          {/* Cube */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-bold dark:text-white">Cube</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Side Length</Label>
                <Input
                  type="number"
                  value={cubeSide}
                  onChange={(e) => setCubeSide(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                  <p className="text-lg font-bold dark:text-white">{cubeVolume.toFixed(2)} units³</p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Surface Area</p>
                  <p className="text-lg font-bold dark:text-white">{cubeSurfaceArea.toFixed(2)} units²</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Cuboid */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-green-600" />
              <h3 className="text-xl font-bold dark:text-white">Cuboid (Rectangular Prism)</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Length</Label>
                  <Input
                    type="number"
                    value={cubeLength}
                    onChange={(e) => setCubeLength(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    value={cubeWidth}
                    onChange={(e) => setCubeWidth(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={cubeHeight}
                    onChange={(e) => setCubeHeight(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                  <p className="text-lg font-bold dark:text-white">{cuboidVolume.toFixed(2)} units³</p>
                </div>
                <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Surface Area</p>
                  <p className="text-lg font-bold dark:text-white">{cuboidSurfaceArea.toFixed(2)} units²</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Sphere */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Circle className="h-5 w-5 text-purple-600" />
              <h3 className="text-xl font-bold dark:text-white">Sphere</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Radius</Label>
                <Input
                  type="number"
                  value={sphereRadius}
                  onChange={(e) => setSphereRadius(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                  <p className="text-lg font-bold dark:text-white">{sphereVolume.toFixed(2)} units³</p>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Surface Area</p>
                  <p className="text-lg font-bold dark:text-white">{sphereSurfaceArea.toFixed(2)} units²</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Cylinder */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Cylinder className="h-5 w-5 text-orange-600" />
              <h3 className="text-xl font-bold dark:text-white">Cylinder</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Radius</Label>
                  <Input
                    type="number"
                    value={cylinderRadius}
                    onChange={(e) => setCylinderRadius(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={cylinderHeight}
                    onChange={(e) => setCylinderHeight(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                  <p className="text-lg font-bold dark:text-white">{cylinderVolume.toFixed(2)} units³</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Surface Area</p>
                  <p className="text-lg font-bold dark:text-white">{cylinderSurfaceArea.toFixed(2)} units²</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Cone */}
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Cone className="h-5 w-5 text-yellow-600" />
              <h3 className="text-xl font-bold dark:text-white">Cone</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Radius</Label>
                  <Input
                    type="number"
                    value={coneRadius}
                    onChange={(e) => setConeRadius(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={coneHeight}
                    onChange={(e) => setConeHeight(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                  <p className="text-lg font-bold dark:text-white">{coneVolume.toFixed(2)} units³</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Surface Area</p>
                  <p className="text-lg font-bold dark:text-white">{coneSurfaceArea.toFixed(2)} units²</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Angles */}
        <TabsContent value="angles" className="mt-4 space-y-4">
          <Card className="p-6 dark:bg-gray-800">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Angle Conversions & Calculations</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Angle (degrees)</Label>
                  <Input
                    type="number"
                    value={angle1}
                    onChange={(e) => setAngle1(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Radians</p>
                    <p className="text-lg font-bold dark:text-white">{degreesToRadians(angle1).toFixed(4)} rad</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Complementary Angle</p>
                    <p className="text-lg font-bold dark:text-white">{complementaryAngle.toFixed(2)}°</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Supplementary Angle</p>
                    <p className="text-lg font-bold dark:text-white">{supplementaryAngle.toFixed(2)}°</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Second Angle (degrees)</Label>
                  <Input
                    type="number"
                    value={angle2}
                    onChange={(e) => setAngle2(parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sum of Angles</p>
                    <p className="text-lg font-bold dark:text-white">{angleSum.toFixed(2)}°</p>
                  </div>
                  <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Third Angle in Triangle</p>
                    <p className="text-lg font-bold dark:text-white">{thirdAngle.toFixed(2)}°</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
