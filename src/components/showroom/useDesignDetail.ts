import { useEffect, useState } from 'react';
import {
  clothTypeRepo,
  type ClothType,
} from '../../repositories/clothTypeRepo';
import { patternRepo, type PatternItem } from '../../repositories/patternRepo';
import { fabricOptions, type FabricLine } from '../../utils/showroomPricing';

export interface DesignDetail {
  item: PatternItem;
  /** Each of its cloths with the fabrics it can be had in. */
  lines: FabricLine[];
}

/**
 * A design with everything on it, for its page in the showroom: its cloths at
 * today's rates, and the other types of each cloth to choose among.
 */
export function useDesignDetail(designId: number): {
  detail: DesignDetail | null;
  failed: boolean;
} {
  const [detail, setDetail] = useState<DesignDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setDetail(null);
    setFailed(false);
    (async () => {
      const item = await patternRepo.getItem(designId);
      if (!item) throw new Error(`No design ${designId}`);
      const clothIds = [
        ...new Set(
          item.cloths
            .map((cloth) => cloth.clothId)
            .filter((id): id is number => id !== null)
        ),
      ];
      const types = new Map<number, ClothType[]>(
        await Promise.all(
          clothIds.map(
            async (id) => [id, await clothTypeRepo.list(id)] as const
          )
        )
      );
      const lines = item.cloths.map((cloth) => ({
        cloth,
        options: fabricOptions(
          cloth,
          cloth.clothId === null ? [] : (types.get(cloth.clothId) ?? [])
        ),
      }));
      if (active) setDetail({ item, lines });
    })().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [designId]);

  return { detail, failed };
}
