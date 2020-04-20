/**
 * Helper class to create a pattern alongside mouse movement from points
 * A Pattern is a combination/array of 2D Vectors while each Vector is an array
 **/
export class PatternConstructor {
  constructor (differenceThreshold = 0, distanceThreshold = 0) {
    this.differenceThreshold = differenceThreshold;
    this.distanceThreshold = distanceThreshold;

    this._lastExtractedPointX = null;
    this._lastExtractedPointY = null;
    this._previousPointX = null;
    this._previousPointY = null;
    this._lastPointX = null;
    this._lastPointY = null;
    this._previousVectoX = null;
    this._previousVectoY = null;

    this._extracedVectors = [];
  }

  /**
   * Resets the internal class variables and clears the constructed pattern
   **/
  clear () {
    // clear extracted vectors
    this._extracedVectors.length = 0;
    // reset variables
    this._lastExtractedPointX = null;
    this._lastExtractedPointY = null;
    this._previousPointX = null;
    this._previousPointY = null;
    this._lastPointX = null;
    this._lastPointY = null;
    this._previousVectoX = null;
    this._previousVectoY = null;
  }


  /**
   * Add a point to the constrcutor
   * Returns true if the added point changed the current pattern (in other words was added to the pattern) else false
   **/
  addPoint (x, y) {
    // return variable that indicates if the given point changed the pattern
    let hasChanged = false;
    // on first point / if no previous point exists
    if (this._previousPointX === null || this._previousPointY === null) {
      // set first extracted point
      this._lastExtractedPointX = x;
      this._lastExtractedPointY = y;
      // set previous point to first point
      this._previousPointX = x;
      this._previousPointY = y;
    }

    else {
      const newVX = x - this._previousPointX;
      const newVY = y - this._previousPointY;
  
      const vectorDistance = Math.hypot(newVX, newVY);
      if (vectorDistance > this.distanceThreshold) {
        // on second point / if no previous vector exists
        if (this._previousVectoX === null || this._previousVectoY === null) {
          // store previous vector
          this._previousVectoX = newVX;
          this._previousVectoY = newVY;
        }
        else {
          // calculate vector difference
          const vectorDifference = vectorDirectionDifference(this._previousVectoX, this._previousVectoY, newVX, newVY);
          if (Math.abs(vectorDifference) > this.differenceThreshold) {
            // store new extracted vector
            this._extracedVectors.push([
              this._previousPointX - this._lastExtractedPointX,
              this._previousPointY - this._lastExtractedPointY
            ]);
            // update previous vector
            this._previousVectoX = newVX;
            this._previousVectoY = newVY;
            // update last extracted point
            this._lastExtractedPointX = this._previousPointX;
            this._lastExtractedPointY = this._previousPointY;
            // set return variable to true
            hasChanged = true;
          }
        }
        // update previous point
        this._previousPointX = x;
        this._previousPointY = y;
      }
    }
    // always store the last point
    this._lastPointX = x;
    this._lastPointY = y;

    return hasChanged;
  }


  /**
   * Returns the current constructed pattern
   * Adds the last added point as the current end point
   **/
  getPattern () {
    // check if variables contain point values
    if (this._lastPointX === null || this._lastPointY === null || this._lastExtractedPointX === null || this._lastExtractedPointY === null) {
      return [];
    }
    // calculate vector from last extracted point to ending point
    const lastVector = [
      this._lastPointX - this._lastExtractedPointX,
      this._lastPointY - this._lastExtractedPointY
    ];
    return [...this._extracedVectors, lastVector];
  }
}


/**
 * Returns the similiarity value of 2 patterns
 * Range: [0, 1]
 * 0 = perfect match / identical
 * 1 maximum mismatch
 **/
export function patternSimilarity (patternA, patternB) {
  const totalAMagnitude = patternMagnitude(patternA);
  const totalBMagnitude = patternMagnitude(patternB);

  let totalDifference = 0;

  let a = 0, b = 0;

  let vectorAMagnitudeProportionStart = 0;
  let vectorBMagnitudeProportionStart = 0;

  while (a < patternA.length && b < patternB.length) {
    const vectorA = patternA[a];
    const vectorB = patternB[b];

    const vectorAMagnitude = Math.hypot(...vectorA);
    const vectorBMagnitude = Math.hypot(...vectorB);

    const vectorAMagnitudeProportion = vectorAMagnitude/totalAMagnitude;
    const vectorBMagnitudeProportion = vectorBMagnitude/totalBMagnitude;

    const vectorAMagnitudeProportionEnd = vectorAMagnitudeProportionStart + vectorAMagnitudeProportion;
    const vectorBMagnitudeProportionEnd = vectorBMagnitudeProportionStart + vectorBMagnitudeProportion;

    // calculate how much both vectors are overlapping
    const overlappingMagnitudeProportion = overlapProportion(
      vectorAMagnitudeProportionStart,
      vectorAMagnitudeProportionEnd,
      vectorBMagnitudeProportionStart,
      vectorBMagnitudeProportionEnd
    );

    // compare which vector magnitude proportion is larger / passing over the other vector
    // take the pattern with the smaller magnitude proportion and increase its index
    // so the next vektor of this pattern will be compared next

    if (vectorAMagnitudeProportionEnd > vectorBMagnitudeProportionEnd) {
      // increase B pattern index / take the next B vektor in the next iteration
      b++;
      // set current end to new start
      vectorBMagnitudeProportionStart = vectorBMagnitudeProportionEnd;
    }
    else if (vectorAMagnitudeProportionEnd < vectorBMagnitudeProportionEnd) {
      // increase A pattern index / take the next A vektor in the next iteration
      a++;
      // set current end to new start
      vectorAMagnitudeProportionStart = vectorAMagnitudeProportionEnd;
    }
    else {
      // increase A & B pattern index / take the next A & B vektor in the next iteration
      a++;
      b++;
      // set current end to new start
      vectorAMagnitudeProportionStart = vectorAMagnitudeProportionEnd;
      vectorBMagnitudeProportionStart = vectorBMagnitudeProportionEnd;
    }

    // calculate the difference of both vectors
    // this will result in a value of 0 - 1
    const vectorDifference = Math.abs(vectorDirectionDifference(vectorA[0], vectorA[1], vectorB[0], vectorB[1]));

    // weight the value by its corresponding magnitude proportion
    // all magnitude proportion should add up to a value of 1 in total (ignoring floating point errors)
    totalDifference += vectorDifference * overlappingMagnitudeProportion;
  }

  return totalDifference;
}


/**
 * Calculates the overlap range of 2 line segments
 **/
function overlapProportion (minA, maxA, minB, maxB) {
  return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB))
}


/**
 * Returns the dierection difference of 2 vectors
 * Range: (-1, 0, 1]
 * 0 = same direction
 * 1 = opposite direction
 * + and - indicate if the direction difference is counter clockwise (+) or clockwise (-)
 **/
function vectorDirectionDifference (V1X, V1Y, V2X, V2Y) {
  // calculate the difference of the vectors angle
  let angleDifference = Math.atan2(V1X, V1Y) - Math.atan2(V2X, V2Y);
  // normalize intervall to [PI, -PI)
  if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
  else if (angleDifference <= -Math.PI) angleDifference += 2 * Math.PI;
  // shift range from [PI, -PI) to [1, -1)
  return angleDifference / Math.PI;
}


/**
 * Calculates the length/magnitude of a pattern
 **/
function patternMagnitude (pattern) {
  return pattern.reduce( (total, vector) => total + Math.hypot(...vector), 0 );
}  