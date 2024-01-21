import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";

export const flow: Flow[] = [
  {
    src: __filename,
    input: col.flow_Markers_created,
    output: sysCol.model_Input,
    idSource: "platform",
    pipeline: [
      {
        $project: {
          model: {
            "@type": "Marker",
            "@id": "$value.uid",
            "@action": "create",
            "@lastSource":"sk11",
            IdentifiedObject_ParentObject: {
              "@id": "$value.placedOn.uid",
              "@lastSource": "keep",
            },
            Marker_IdentifiedObject: {
              "@id": "$value.placedOn.uid",
              "@lastSource": "keep",
            },

            Marker_TypeMarker: {
              "@id": "$value.tagType.uid",
              "@type": "MarkerType",
              "@action": "create",
              "@lastSource":"sk11",
              IdentifiedObject_name: "$value.tagType.name",
            },

            Marker_TimeCreated: { $dateFromString: { dateString: "$value.createdDateTime" } },
            Marker_Text: "$value.description",
            Marker_CreatedBy: {
              "@id": "$value.createdBy.uid",
              "@type": "Person",
              "@action": "create",
              "@lastSource":"sk11",
              IdentifiedObject_ParentObject: {
                "@id": "745c9faf-5d9f-44fd-8439-197e248febd2",
                "@lastSource": "keep",
              },
              IdentifiedObject_name: "$value.createdBy.name",
            },
          },
        },
      },
    ],
  },

  {
    src: __filename,
    input: "flow_Markers_deleted",
    output: sysCol.model_Input,
    idSource: "platform",
    pipeline: [
      {
        $project: {
          model: {
            "@type": "Marker",
            "@id": '$value.uid',
            "@action": "delete",
            "@lastSource": "sk11",
          },
        },
      },
    ],
  }
];