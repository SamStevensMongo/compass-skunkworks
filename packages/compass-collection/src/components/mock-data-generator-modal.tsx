import React, { useState } from 'react';

import { Chip, Variant } from '@leafygreen-ui/chip';
import type { Document } from 'mongodb';

import {
  Body,
  css,
  Combobox,
  ComboboxOption,
  Code,
  Checkbox,
  TextInput,
  Banner,
  SpinLoaderWithLabel,
} from '@mongodb-js/compass-components';

import { Size, Select, Option } from '@leafygreen-ui/select';
import TextArea from '@leafygreen-ui/text-area';
import {
  Table,
  TableHead,
  HeaderRow,
  HeaderCell,
  TableBody,
  Row,
  Cell,
} from '@leafygreen-ui/table';
import {
  SegmentedControl,
  SegmentedControlOption,
} from '@leafygreen-ui/segmented-control';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import {
  fetchSampleDocuments,
  type CollectionState,
} from '../modules/collection-tab';
import { ObjectId } from 'bson';
import {
  FAKE_SCHEMA_GENERATE_RESPONSE,
  FAKER_DATA_TYPES,
  MONGODB_DATA_TYPES,
  SampledDocuments,
  SchemaGenerateResponse,
} from '../constants';

const columnStyles = css`
  display: flex;
  gap: 8px;
  flex-direction: row;
  margin: 20px 0;
`;

const rowStyles = css`
  display: flex;
  gap: 4px;
  flex-direction: column;
  width: 256px;
`;

const footerStyles = css`
  flex-direction: row;
  justify-content: space-between;
`;

const rightButtonsStyles = css`
  display: flex;
  gap: 8px;
  flex-direction: row;
`;

const comboboxStyles = css`
  width: 500px;
  margin-top: 20px;
`;

const tableStyles = css`
  table {
    table-layout: fixed;
    width: 100%;
  }

  tbody tr:first-child td {
    padding-top: 10px;
  }

  th:nth-child(1),
  td:nth-child(1) {
    width: 20%;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 20%;
  }

  th:nth-child(3),
  td:nth-child(3) {
    width: 30%;
  }

  th:nth-child(4),
  td:nth-child(4) {
    width: 30%;
  }

  th:first-of-type,
  td:first-child {
    padding-left: 0;
  }
  td:last-child {
    white-space: normal;
    word-break: break-word;
    padding: 8px;
  }
`;

const tableSelectStyles = css`
  label {
    display: none;
  }
  select {
    width: 100%;
  }
`;

const textAreaStyles = css`
  label {
    display: none;
  }
  textarea {
    width: 100%;
    min-height: 32px;
    resize: vertical;
  }
`;

const chipTitleStyles = css`
  font-weight: 600;
`;

const chipStyles = css`
  width: fit-content;
`;

const codeStyles = css`
  height: 450px;
  overflow: auto;
`;

const MAX_NUMBER_OF_STEPS = 4;
const LAST_STEP = MAX_NUMBER_OF_STEPS - 1;
const DEFAULT_NUMBER_OF_DOCUMENTS = 100;

type MockDataGeneratorModalState = {
  collections: Array<string>;
  sampledDocuments: Array<SampledDocuments> | null;
};

const SchemaViewStep = ({ schema }: { schema: SchemaGenerateResponse }) => {
  const [activeTab, setActiveTab] = useState(schema.collections[0].name);

  // Add state for schema modifications
  const [schemaState, setSchemaState] = useState(() => {
    // Initialize state from FAKE_SCHEMA_GENERATE_RESPONSE
    return schema.collections.reduce((acc, collection) => {
      acc[collection.name] = { ...collection.schema };
      return acc;
    }, {} as Record<string, Record<string, any>>);
  });

  // Handler for MongoDB data type changes
  const handleMongoDBTypeChange = (
    collectionName: string,
    fieldName: string,
    newType: string
  ) => {
    setSchemaState((prev) => ({
      ...prev,
      [collectionName]: {
        ...prev[collectionName],
        [fieldName]: {
          ...prev[collectionName][fieldName],
          type: newType,
        },
      },
    }));
  };

  // Handler for Faker module changes
  const handleFakerModuleChange = (
    collectionName: string,
    fieldName: string,
    newFaker: string
  ) => {
    setSchemaState((prev) => ({
      ...prev,
      [collectionName]: {
        ...prev[collectionName],
        [fieldName]: {
          ...prev[collectionName][fieldName],
          faker: newFaker,
        },
      },
    }));
  };

  // Handler for Faker args changes
  const handleFakerArgsChange = (
    collectionName: string,
    fieldName: string,
    index: number,
    newValue: string
  ) => {
    setSchemaState((prev) => {
      const currentArgs = [
        ...(prev[collectionName][fieldName].fakerArgs || []),
      ];
      currentArgs[index] = newValue;
      return {
        ...prev,
        [collectionName]: {
          ...prev[collectionName],
          [fieldName]: {
            ...prev[collectionName][fieldName],
            fakerArgs: currentArgs,
          },
        },
      };
    });
  };

  // Handler for adding new faker arg
  const handleAddFakerArg = (collectionName: string, fieldName: string) => {
    setSchemaState((prev) => ({
      ...prev,
      [collectionName]: {
        ...prev[collectionName],
        [fieldName]: {
          ...prev[collectionName][fieldName],
          fakerArgs: [...(prev[collectionName][fieldName].fakerArgs || []), ''],
        },
      },
    }));
  };

  return (
    <div>
      <p>
        We sampled docs from your collections to infer the following schema.
        Feel free to edit the values as needed.
      </p>

      <SegmentedControl
        value={activeTab}
        onChange={(value) => setActiveTab(value)}
      >
        {schema.collections.map((collection) => {
          return (
            <SegmentedControlOption
              key={collection.name}
              value={collection.name}
            >
              {collection.name}
            </SegmentedControlOption>
          );
        })}
        <SegmentedControlOption value={'relationships'}>
          relationships
        </SegmentedControlOption>
      </SegmentedControl>
      {schema.collections.map((collection) => {
        return (
          <div key={collection.name}>
            {activeTab === collection.name && (
              <Table className={tableStyles}>
                <TableHead>
                  <HeaderRow>
                    <HeaderCell>Field Name</HeaderCell>
                    <HeaderCell>MongoDB Data Type</HeaderCell>
                    <HeaderCell>Faker-js Module</HeaderCell>
                    <HeaderCell>Faker-js Args</HeaderCell>
                  </HeaderRow>
                </TableHead>
                <TableBody>
                  {Object.keys(collection.schema).map((fieldName) => {
                    const metadata = schemaState[collection.name][fieldName];
                    return (
                      <Row key={fieldName}>
                        <Cell>{fieldName}</Cell>
                        <Cell>
                          <Select
                            className={tableSelectStyles}
                            value={metadata.type}
                            onChange={(value) =>
                              handleMongoDBTypeChange(
                                collection.name,
                                fieldName,
                                value
                              )
                            }
                            label="MongoDB Data Type"
                            dropdownWidthBasis="option"
                            size={Size.Small}
                          >
                            {MONGODB_DATA_TYPES.map((type) => (
                              <Option key={type} value={type}>
                                {type}
                              </Option>
                            ))}
                          </Select>
                        </Cell>
                        <Cell>
                          <Select
                            className={tableSelectStyles}
                            value={metadata.faker ?? ''}
                            onChange={(value) =>
                              handleFakerModuleChange(
                                collection.name,
                                fieldName,
                                value
                              )
                            }
                            label="Faker Module"
                            dropdownWidthBasis="option"
                            size={Size.Small}
                          >
                            {FAKER_DATA_TYPES.map((type) => (
                              <Option key={type} value={type}>
                                {type}
                              </Option>
                            ))}
                          </Select>
                        </Cell>
                        <Cell>
                          <div
                            className={css`
                              display: flex;
                              flex-direction: column;
                              gap: 8px;
                            `}
                          >
                            {metadata.faker === 'helpers.arrayElement' ? (
                              <TextArea
                                className={textAreaStyles}
                                value={
                                  metadata.fakerArgs
                                    ? JSON.stringify(metadata.fakerArgs)
                                    : ''
                                }
                                onChange={(
                                  e: React.ChangeEvent<HTMLTextAreaElement>
                                ) =>
                                  handleFakerArgsChange(
                                    collection.name,
                                    fieldName,
                                    0,
                                    e.target.value
                                  )
                                }
                                placeholder="Enter comma-separated values"
                                aria-labelledby={`faker-args-${fieldName}-0`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                  }
                                }}
                              />
                            ) : (
                              metadata.fakerArgs?.map(
                                (arg: any, index: number) => (
                                  <TextArea
                                    key={index}
                                    className={textAreaStyles}
                                    value={
                                      typeof arg === 'object'
                                        ? JSON.stringify(arg)
                                        : String(arg)
                                    }
                                    onChange={(
                                      e: React.ChangeEvent<HTMLTextAreaElement>
                                    ) =>
                                      handleFakerArgsChange(
                                        collection.name,
                                        fieldName,
                                        index,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Argument ${index + 1}`}
                                    aria-labelledby={`faker-args-${fieldName}-${index}`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                )
                              )
                            )}
                          </div>
                        </Cell>
                      </Row>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        );
      })}

      {activeTab === 'relationships' && (
        <div>
          <Code
            id="relationship-preview"
            data-testid="relationship-preview"
            language="json"
            copyable={false}
          >
            {`${JSON.stringify(
              FAKE_SCHEMA_GENERATE_RESPONSE.relationships[0],
              null,
              2
            )}`}
          </Code>
        </div>
      )}
    </div>
  );
};

const ConfirmNumberOfDocumentsStep = ({
  numberOfDocuments,
  setNumberOfDocuments,
  numberOfDocumentsReference,
  setNumberOfDocumentsReference,
  collName,
  referenceCollName,
}: {
  numberOfDocuments: number;
  setNumberOfDocuments: (numberOfDocuments: number) => void;
  numberOfDocumentsReference: number;
  setNumberOfDocumentsReference: (numberOfDocuments: number) => void;
  collName: string;
  referenceCollName?: string;
}) => {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div className={rowStyles} style={{ flex: 1 }}>
        <TextInput
          label={`Documents to generate in ${collName}`}
          id="number-of-documents"
          aria-label="number-of-documents"
          type="number"
          min="1"
          value={`${numberOfDocuments}`}
          onChange={(e) =>
            setNumberOfDocuments(Number.parseInt(e.target.value))
          }
        />
      </div>
      {referenceCollName && (
        <div className={rowStyles} style={{ flex: 1 }}>
          <TextInput
            label={`Documents to generate in ${referenceCollName}`}
            id="number-of-documents-reference"
            aria-label="number-of-documents-reference"
            type="number"
            min="1"
            value={`${numberOfDocumentsReference}`}
            onChange={(e) =>
              setNumberOfDocumentsReference(Number.parseInt(e.target.value))
            }
          />
        </div>
      )}
    </div>
  );
};

const SelectCollectionsStep = ({
  collections,
  collName,
  selectedRelatedCollections,
  onCollectionSelect,
}: {
  collections: Array<string>;
  collName: string;
  selectedRelatedCollections: Array<string>;
  onCollectionSelect: (selectedCollection: Array<string>) => void;
}) => {
  return (
    <div className={comboboxStyles}>
      <Combobox
        data-testid="generate-mock-data-combobox"
        clearable={true}
        multiselect={true}
        label="Related Collections (Optional)"
        searchEmptyMessage="No collection found"
        onChange={onCollectionSelect}
        value={selectedRelatedCollections}
        size={Size.Small}
      >
        {collections
          .filter((collection) => collection !== collName)
          .map((collection) => {
            return (
              <ComboboxOption key={collection} value={collection}>
                {collection}
              </ComboboxOption>
            );
          })}
      </Combobox>
    </div>
  );
};

const DataPreviewStep = ({
  isAiWarningChecked,
  setIsAiWarningChecked,
  documents,
}: {
  isAiWarningChecked: boolean;
  setIsAiWarningChecked: (isAiWarningChecked: boolean) => void;
  documents: Array<Document>;
}) => {
  const stringifiedDocuments = JSON.stringify(documents);
  return (
    <div>
      <Code
        id="mock-data-preview"
        data-testid="mock-data-preview"
        language="json"
        copyable={false}
        className={codeStyles}
      >
        {stringifiedDocuments}
      </Code>

      <div
        className={css`
          margin-top: 10px;
        `}
      >
        <Checkbox
          data-testid="ai-warning-checkbox"
          id="ai-warning-checkbox"
          label="AI Warning"
          onChange={() => setIsAiWarningChecked(!isAiWarningChecked)}
          checked={isAiWarningChecked}
          description="Check this because you understand that this is using AI and so data
          blah blah blah blah robots are coming just be aware!!!!"
        />
      </div>
    </div>
  );
};

function createCsrfHeaders() {
  return Array.from(document.getElementsByTagName('meta')).reduce((acc, el) => {
    if (el.getAttribute('name') === 'csrf-token') {
      acc['X-CSRF-Token'] = el.getAttribute('content');
    }
    if (el.getAttribute('name') === 'csrf-time') {
      acc['X-CSRF-Time'] = el.getAttribute('content');
    }

    return acc;
  }, {} as any);
}

const getPrimaryButtonText = (currentStep: number) => {
  switch (currentStep) {
    case 0:
    case 1:
      return 'Next';
    case 2:
      return 'Preview';
    case 3:
      return 'Insert Mock Data';
    default:
      return '';
  }
};

const MockDataGeneratorModal: React.FunctionComponent<
  MockDataGeneratorModalState & {
    modalOpen: boolean;
    onModalClose: () => void;
    dbName: string;
    collName: string;
    onCollectionsSelected: (namespaces: Array<string>) => void;
  }
> = ({
  modalOpen,
  onModalClose,
  dbName,
  collName,
  collections,
  sampledDocuments,
  onCollectionsSelected,
}) => {
  const [selectedRelatedCollections, setSelectedRelatedCollections] = useState<
    Array<string>
  >(collections.filter((coll) => coll !== collName));

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNumberOfDocuments, setSelectedNumberOfDocuments] =
    useState<number>(DEFAULT_NUMBER_OF_DOCUMENTS);
  const [
    selectedNumberOfDocumentsReference,
    setSelectedNumberOfDocumentsReference,
  ] = useState<number>(DEFAULT_NUMBER_OF_DOCUMENTS);
  const [isAiWarningChecked, setIsAiWarningChecked] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [schema, setSchema] = useState<SchemaGenerateResponse | null>(null);
  const [previewDocuments, setPreviewDocuments] =
    useState<Array<Document> | null>(null);

  if (!modalOpen) {
    return null;
  }

  const onCollectionSelect = (selectedCollection: Array<string>) => {
    setSelectedRelatedCollections(selectedCollection);
    onCollectionsSelected(
      [...selectedCollection, collName].map((coll) => dbName.concat('.', coll))
    );
  };

  const fetchSchema = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/schemaGenerator/generate', {
        method: 'POST',
        body: JSON.stringify(sampledDocuments),
        headers: {
          'Content-Type': 'application/json',
          ...createCsrfHeaders(),
        },
        credentials: 'include',
      });
      const data = (await response.json()) as SchemaGenerateResponse;
      setSchema(data);
    } catch (error: any) {
      setErrorMessage(error.message);
      console.log({ error });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreviewDocuments = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        'http://localhost:3000/api/data-generation/sample',
        {
          method: 'POST',
          body: JSON.stringify({ schema }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const previewData = await response.json();
      setPreviewDocuments(previewData);
    } catch (error: any) {
      setErrorMessage(error.message);
      console.log({ error });
    } finally {
      setIsLoading(false);
    }
  };

  const submitDataGenerationJob = async () => {
    try {
      setIsLoading(true);
      await fetch('http://localhost:3000/api/data-generation/jobs', {
        method: 'POST',
        body: JSON.stringify({
          schema,
          idempotencyKey: new ObjectId().toHexString(),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {
      setErrorMessage(error.message);
      console.log({ error });
    } finally {
      setIsLoading(false);
      onModalClose();
    }
  };

  const onPrimaryButtonClick = async () => {
    setErrorMessage(null);
    if (currentStep === 0) {
      fetchSchema();
    }

    if (currentStep === 2) {
      fetchPreviewDocuments();
    }

    if (currentStep === LAST_STEP) {
      submitDataGenerationJob();
    }
    if (currentStep < LAST_STEP) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onBackButtonClick = () => {
    setErrorMessage(null);

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const hasNotConfirmedAiWarning = !isAiWarningChecked && currentStep === 3;
  const shouldDisablePrimaryButton = hasNotConfirmedAiWarning || !!errorMessage;

  return (
    <Modal
      open={modalOpen}
      setOpen={onModalClose}
      size={currentStep === 1 ? 'large' : 'default'}
      data-testid="generate-mock-data-modal"
    >
      <ModalHeader title="Generate Mock Data" />
      <ModalBody>
        {isLoading ? (
          <SpinLoaderWithLabel progressText="Loading" />
        ) : (
          <>
            {errorMessage && (
              <Banner variant="danger">
                <Body>{errorMessage}</Body>
              </Banner>
            )}

            {currentStep !== LAST_STEP && (
              <div className={columnStyles}>
                <div className={rowStyles}>
                  <Body className={chipTitleStyles}>Database</Body>
                  <Chip
                    className={chipStyles}
                    variant={Variant.Gray}
                    label={dbName}
                  >
                    {dbName}
                  </Chip>
                </div>

                <div className={rowStyles}>
                  <Body className={chipTitleStyles}>Collection</Body>
                  <Chip
                    className={chipStyles}
                    variant={Variant.Gray}
                    label={collName}
                  >
                    {collName}
                  </Chip>
                </div>

                {(currentStep === 1 || currentStep === 2) &&
                  selectedRelatedCollections.length > 0 && (
                    <div className={rowStyles}>
                      <Body weight="medium">Related Collection</Body>
                      <Chip
                        className={chipStyles}
                        variant={Variant.Gray}
                        label={selectedRelatedCollections[0]}
                      >
                        {selectedRelatedCollections[0]}
                      </Chip>
                    </div>
                  )}
              </div>
            )}
            {currentStep === 0 && (
              <SelectCollectionsStep
                collections={collections}
                collName={collName}
                selectedRelatedCollections={selectedRelatedCollections}
                onCollectionSelect={onCollectionSelect}
              />
            )}
            {currentStep === 1 && schema && <SchemaViewStep schema={schema} />}
            {currentStep === 2 && (
              <ConfirmNumberOfDocumentsStep
                numberOfDocuments={selectedNumberOfDocuments}
                setNumberOfDocuments={setSelectedNumberOfDocuments}
                numberOfDocumentsReference={selectedNumberOfDocumentsReference}
                setNumberOfDocumentsReference={
                  setSelectedNumberOfDocumentsReference
                }
                collName={collName}
                referenceCollName={selectedRelatedCollections[0]}
              />
            )}
            {currentStep === 3 && previewDocuments && (
              <DataPreviewStep
                isAiWarningChecked={isAiWarningChecked}
                setIsAiWarningChecked={setIsAiWarningChecked}
                documents={previewDocuments}
              />
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter className={footerStyles}>
        <Button onClick={onBackButtonClick}>Back</Button>
        <div className={rightButtonsStyles}>
          <Button onClick={onModalClose}>Cancel</Button>
          <Button
            disabled={shouldDisablePrimaryButton}
            variant={ButtonVariant.Primary}
            onClick={onPrimaryButtonClick}
          >
            {getPrimaryButtonText(currentStep)}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

const mapStateToProps = (state: CollectionState) => ({
  collections: state.collections,
  sampledDocuments: state.sampledDocuments,
});

const MappedExportToLanguageModal = connect(mapStateToProps, {
  onCollectionsSelected: fetchSampleDocuments,
})(MockDataGeneratorModal);

export default MappedExportToLanguageModal;
