


// Пока решил не использовать

// export function innerJoinEntity(
//   localField: string,
//   from: string,
//   as: string
// ): any[] {
//   return innerJoin(localField, from, "id", as);
// }

// export function outerJoinEntity(
//   localField: string,
//   from: string,
//   as: string
// ): any[] {
//   return outerJoin(localField, from, "id", as);
// }

// export function innerJoin(
//   localField: string,
//   from: string,
//   foreignField: string,
//   as: string
// ): any[] {
//   return join(localField, from, foreignField, as, false);
// }

// export function outerJoin(
//   localField: string,
//   from: string,
//   foreignField: string,
//   as: string
// ): any[] {
//   return join(localField, from, foreignField, as, true);
// }

// function join(
//   localField: string,
//   from: string,
//   foreignField: string,
//   as: string,
//   preserveNullAndEmptyArrays: boolean
// ): any[] {
//   var steps: any[] = [
//     {
//       $lookup: {
//         localField: localField,
//         from: from,
//         foreignField: foreignField,
//         as: as,
//       },
//     },
//   ];
//   if (preserveNullAndEmptyArrays) {
//     steps.push({
//       $unwind: {
//         path: `$${as}`,
//         preserveNullAndEmptyArrays: true,
//       },
//     });
//   }
//   return steps;
// }
