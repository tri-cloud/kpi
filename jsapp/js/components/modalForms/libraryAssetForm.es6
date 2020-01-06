import React from 'react';
import reactMixin from 'react-mixin';
import autoBind from 'react-autobind';
import Reflux from 'reflux';
import TagsInput from 'react-tagsinput';
import Select from 'react-select';
import TextBox from 'js/components/textBox';
import {bem} from 'js/bem';
import TextareaAutosize from 'react-autosize-textarea';
import {stores} from 'js/stores';
import {actions} from 'js/actions';
import {hashHistory} from 'react-router';
import {
  t,
  notify
} from 'js/utils';
import assetUtils from 'js/assetUtils';
import {
  renderLoading,
  renderBackButton
} from './modalHelpers';
import {ASSET_TYPES} from 'js/constants';

/**
 * Modal for creating or updating library asset (collection or template)
 *
 * @prop {Object} asset - Modal asset.
 */
export class LibraryAssetForm extends React.Component {
  constructor(props) {
    super(props);
    this.unlisteners = [];
    this.state = {
      isSessionLoaded: !!stores.session.currentAccount,
      data: {
        name: '',
        organization: '',
        country: null,
        sector: null,
        tags: [],
        description: ''
      },
      isPending: false
    };
    autoBind(this);
    if (this.props.asset) {
      this.applyPropsData();
    }
  }

  componentDidMount() {
    this.listenTo(stores.session, () => {
      this.setState({isSessionLoaded: true});
    });
    this.unlisteners.push(
      actions.resources.createResource.completed.listen(this.onCreateResourceCompleted.bind(this)),
      actions.resources.createResource.failed.listen(this.onCreateResourceFailed.bind(this)),
      actions.resources.updateAsset.completed.listen(this.onUpdateAssetCompleted.bind(this)),
      actions.resources.updateAsset.failed.listen(this.onUpdateAssetFailed.bind(this))
    );
  }

  componentWillUnmount() {
    this.unlisteners.forEach((clb) => {clb();});
  }

  applyPropsData() {
    if (this.props.asset.name) {
      this.state.data.name = this.props.asset.name;
    }
    if (this.props.asset.settings.organization) {
      this.state.data.organization = this.props.asset.settings.organization;
    }
    if (this.props.asset.settings.country) {
      this.state.data.country = this.props.asset.settings.country;
    }
    if (this.props.asset.settings.sector) {
      this.state.data.sector = this.props.asset.settings.sector;
    }
    if (this.props.asset.settings.tags) {
      this.state.data.tags = this.props.asset.settings.tags;
    }
    if (this.props.asset.settings.description) {
      this.state.data.description = this.props.asset.settings.description;
    }
  }

  onCreateResourceCompleted(response) {
    this.setState({isPending: false});
    notify(t('##type## ##name## created').replace('##type##', this.getFormAssetType()).replace('##name##', response.name));
    stores.pageState.hideModal();
    if (this.getFormAssetType() === ASSET_TYPES.collection.id) {
      hashHistory.push(`/library/asset/${response.uid}`);
    } else if (this.getFormAssetType() === ASSET_TYPES.template.id) {
      hashHistory.push(`/library/asset/${response.uid}/edit`);
    }
  }

  onCreateResourceFailed() {
    this.setState({isPending: false});
    notify(t('Failed to create ##type##').replace('##type##', this.getFormAssetType()), 'error');
  }

  onUpdateAssetCompleted() {
    this.setState({isPending: false});
    stores.pageState.hideModal();
  }

  onUpdateAssetFailed() {
    this.setState({isPending: false});
    notify(t('Failed to update ##type##').replace('##type##', this.getFormAssetType()), 'error');
  }

  onSubmit() {
    this.setState({isPending: true});

    if (this.props.asset) {
      actions.resources.updateAsset(
        this.props.asset.uid,
        {
          name: this.state.data.name,
          settings: JSON.stringify({
            organization: this.state.data.organization,
            country: this.state.data.country,
            sector: this.state.data.sector,
            tags: this.state.data.tags,
            description: this.state.data.description
          })
        }
      );
    } else {
      actions.resources.createResource({
        name: this.state.data.name,
        asset_type: this.getFormAssetType(),
        settings: JSON.stringify({
          organization: this.state.data.organization,
          country: this.state.data.country,
          sector: this.state.data.sector,
          tags: this.state.data.tags,
          description: this.state.data.description
        })
      });
    }
  }

  onPropertyChange(property, newValue) {
    const data = this.state.data;
    data[property] = newValue;
    this.setState({data: data});
  }

  onNameChange(newValue) {this.onPropertyChange('name', newValue);}
  onOrganizationChange(newValue) {this.onPropertyChange('organization', newValue);}
  onCountryChange(newValue) {this.onPropertyChange('country', newValue);}
  onSectorChange(newValue) {this.onPropertyChange('sector', newValue);}
  onTagsChange(newValue) {this.onPropertyChange('tags', assetUtils.cleanupTags(newValue));}
  onDescriptionChange(evt) {this.onPropertyChange('description', evt.target.value);}

  /**
   * @returns existing asset type or desired asset type
   */
  getFormAssetType() {
    return this.props.asset ? this.props.asset.asset_type : this.props.assetType;
  }

  isSubmitEnabled() {
    return !this.state.isPending;
  }

  getSubmitButtonLabel() {
    if (this.props.asset) {
      if (this.state.isPending) {
        return t('Saving…');
      } else {
        return t('Save');
      }
    } else if (this.state.isPending) {
      return t('Creating…');
    } else {
      return t('Create');
    }
  }

  render() {
    if (!this.state.isSessionLoaded) {
      return renderLoading();
    }

    const SECTORS = stores.session.environment.available_sectors;
    const COUNTRIES = stores.session.environment.available_countries;

    return (
      <bem.FormModal__form className='project-settings'>
        <bem.FormModal__item m='wrapper' disabled={this.state.isPending}>
          <bem.FormModal__item>
            <TextBox
              value={this.state.data.name}
              onChange={this.onNameChange}
              label={t('Name')}
            />
          </bem.FormModal__item>

          <bem.FormModal__item>
            <TextBox
              value={this.state.data.organization}
              onChange={this.onOrganizationChange}
              label={t('Organization')}
            />
          </bem.FormModal__item>

          <bem.FormModal__item>
            <label htmlFor='country'>
              {t('Country')}
            </label>

            <Select
              id='country'
              value={this.state.data.country}
              onChange={this.onCountryChange}
              options={COUNTRIES}
              className='kobo-select'
              classNamePrefix='kobo-select'
              menuPlacement='auto'
              isClearable
            />
          </bem.FormModal__item>

          <bem.FormModal__item>
            <label htmlFor='sector'>
              {t('Primary Sector')}
            </label>

            <Select
              id='sector'
              value={this.state.data.sector}
              onChange={this.onSectorChange}
              options={SECTORS}
              className='kobo-select'
              classNamePrefix='kobo-select'
              menuPlacement='auto'
              isClearable
            />
          </bem.FormModal__item>

          <bem.FormModal__item>
            <TagsInput
              value={this.state.data.tags}
              onChange={this.onTagsChange}
              inputProps={{placeholder: t('Tags')}}
            />
          </bem.FormModal__item>

          <bem.FormModal__item>
            <TextareaAutosize
              onChange={this.onDescriptionChange}
              value={this.state.data.description}
              placeholder={t('Enter short description here')}
            />
          </bem.FormModal__item>
        </bem.FormModal__item>

        <bem.Modal__footer>
          {renderBackButton(this.state.isPending)}

          <bem.Modal__footerButton
            m='primary'
            type='submit'
            onClick={this.onSubmit}
            disabled={!this.isSubmitEnabled()}
            className='mdl-js-button'
          >
            {this.getSubmitButtonLabel()}
          </bem.Modal__footerButton>
        </bem.Modal__footer>
      </bem.FormModal__form>
    );
  }
}

reactMixin(LibraryAssetForm.prototype, Reflux.ListenerMixin);